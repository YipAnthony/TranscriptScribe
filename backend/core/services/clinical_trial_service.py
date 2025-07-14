from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial
from ports.db import DatabasePort
from ports.clinical_trials import ClinicalTrialsPort
from ports.llm import LLMPort
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError
from typing import Dict, List, Optional
import json
import logging

logger = logging.getLogger(__name__)

class ClinicalTrialService:
    def __init__(self, db_adapter: DatabasePort, clinical_trials_adapter: ClinicalTrialsPort, llm_adapter: LLMPort):
        self.db_adapter = db_adapter
        self.clinical_trials_adapter = clinical_trials_adapter
        self.llm_adapter = llm_adapter
    
    async def create_recommended_trials(self, patient_id: str, transcript_id: str) -> None:
        """
        Create recommended clinical trials based on patient profile and appointment transcript.
        Uses a multi-agent approach with specialized agents for eligibility filtering and relevance ranking.
        Stores trials using the DB adapter.
        
        Args:
            patient_id: ID of the patient
            transcript_id: ID of the transcript
            
        Raises:
            PatientNotFoundError: If patient is not found
            TranscriptNotFoundError: If transcript is not found
        """
        # 1. Get patient and transcript data from database
        logger.info(f"Fetching patient {patient_id} and transcript {transcript_id}")
        patient = self.db_adapter.get_patient(patient_id)
        parsed_transcript = self.db_adapter.get_transcript(transcript_id)
        
        # 2. Get initial list of clinical trials
        logger.info("Searching for initial clinical trials")
        initial_trials = await self.clinical_trials_adapter.find_recommended_clinical_trials(patient, parsed_transcript)
        logger.info(f"Found {len(initial_trials)} initial clinical trials")
        
        if not initial_trials:
            logger.info("No clinical trials found, storing empty recommendations")
            # Store empty recommendations
            try:
                existing_recommendations = self.db_adapter.get_transcript_recommendations(transcript_id)
                if existing_recommendations:
                    self.db_adapter.update_transcript_recommendations(transcript_id, [], [])
                else:
                    self.db_adapter.create_transcript_recommendations(transcript_id, [], [])
            except Exception as e:
                logger.error(f"Failed to store empty transcript recommendations: {e}")
            return
        
        # 3. Agent 1: Eligibility Filter Agent - Separate eligible and uncertain trials
        logger.info("Agent 1: Filtering trials by eligibility criteria")
        eligibility_result = await self._eligibility_filter_agent(patient, parsed_transcript, initial_trials)
        eligible_trial_ids = eligibility_result.get("eligible_trial_ids", [])
        uncertain_trial_ids = eligibility_result.get("uncertain_trial_ids", [])
        logger.info(f"Eligibility filter: {len(eligible_trial_ids)} eligible, {len(uncertain_trial_ids)} uncertain")
        
        # 4. Agent 2: Relevance Ranking Agent - Rank eligible trials by relevance
        ranked_eligible_trial_ids = []
        if eligible_trial_ids:
            logger.info("Agent 2: Ranking eligible trials by relevance")
            ranked_eligible_trial_ids = await self._relevance_ranking_agent(patient, parsed_transcript, initial_trials, eligible_trial_ids, "eligible")
            logger.info(f"Relevance ranking (eligible): {len(ranked_eligible_trial_ids)} trials ranked")
        
        # 5. Agent 2: Relevance Ranking Agent - Rank uncertain trials by relevance
        ranked_uncertain_trial_ids = []
        if uncertain_trial_ids:
            logger.info("Agent 2: Ranking uncertain trials by relevance")
            ranked_uncertain_trial_ids = await self._relevance_ranking_agent(patient, parsed_transcript, initial_trials, uncertain_trial_ids, "uncertain")
            logger.info(f"Relevance ranking (uncertain): {len(ranked_uncertain_trial_ids)} trials ranked")
        
        # 6. Store all trials in Supabase
        logger.info("Storing clinical trials in Supabase")
        for trial in initial_trials:
            try:
                self.db_adapter.upsert_clinical_trial(trial)
            except Exception as e:
                logger.error(f"Failed to store trial {trial.external_id}: {e}")
        
        # 7. Store transcript recommendations
        logger.info("Storing transcript recommendations")
        try:
            # Check if transcript recommendations already exist
            existing_recommendations = self.db_adapter.get_transcript_recommendations(transcript_id)
            if existing_recommendations:
                self.db_adapter.update_transcript_recommendations(transcript_id, ranked_eligible_trial_ids, ranked_uncertain_trial_ids)
            else:
                self.db_adapter.create_transcript_recommendations(transcript_id, ranked_eligible_trial_ids, ranked_uncertain_trial_ids)
        except Exception as e:
            logger.error(f"Failed to store transcript recommendations: {e}")
        
        logger.info(f"Successfully created recommendations: {len(ranked_eligible_trial_ids)} eligible and {len(ranked_uncertain_trial_ids)} uncertain trial IDs")
    
    def _create_comprehensive_patient_info(self, patient: Patient, parsed_transcript: ParsedTranscript) -> str:
        """
        Create comprehensive patient information prioritizing patient fields over parsed transcript fields.
        
        Args:
            patient: Patient domain object
            parsed_transcript: Parsed transcript domain object
            
        Returns:
            str: Formatted patient information string
        """
        # Prioritize patient fields over parsed transcript fields
        age = parsed_transcript.age if parsed_transcript.age is not None else (
            f"{(patient.date_of_birth.year - 2024) if patient.date_of_birth else 'Unknown'}"
        )
        sex = patient.sex if patient.sex else parsed_transcript.sex
        
        patient_info = f"""
            PATIENT PROFILE:
            - Name: {patient.first_name} {patient.last_name}
            - Age: {age}
            - Sex: {sex or 'Not specified'}
            - Location (city, state, country, zip code): {patient.city}, {patient.state}, {patient.country}, {patient.zip_code}

            MEDICAL INFORMATION:
            - Current Conditions: {', '.join(parsed_transcript.conditions) if parsed_transcript.conditions else 'None'}
            - Current Medications: {', '.join(parsed_transcript.medications) if parsed_transcript.medications else 'None'}
            - Procedures: {', '.join(parsed_transcript.procedures) if parsed_transcript.procedures else 'None'}
            - Positive Symptoms: {', '.join(parsed_transcript.positive_symptoms) if parsed_transcript.positive_symptoms else 'None'}
            - Negative Symptoms: {', '.join(parsed_transcript.negative_symptoms) if parsed_transcript.negative_symptoms else 'None'}
            - Past Diagnoses: {', '.join(parsed_transcript.past_diagnoses) if parsed_transcript.past_diagnoses else 'None'}
            - Past Surgeries: {', '.join(parsed_transcript.past_surgeries) if parsed_transcript.past_surgeries else 'None'}
            - Family History: {', '.join(parsed_transcript.family_history) if parsed_transcript.family_history else 'None'}

            LAB & IMAGING RESULTS:
            - Positive Lab Results: {', '.join(parsed_transcript.positive_lab_results) if parsed_transcript.positive_lab_results else 'None'}
            - Negative Lab Results: {', '.join(parsed_transcript.negative_lab_results) if parsed_transcript.negative_lab_results else 'None'}
            - Positive Imaging Results: {', '.join(parsed_transcript.positive_imaging_results) if parsed_transcript.positive_imaging_results else 'None'}
            - Negative Imaging Results: {', '.join(parsed_transcript.negative_imaging_results) if parsed_transcript.negative_imaging_results else 'None'}

            LIFESTYLE FACTORS:
            - Positive Lifestyle Factors: {', '.join(parsed_transcript.positive_lifestyle_factors) if parsed_transcript.positive_lifestyle_factors else 'None'}
            - Negative Lifestyle Factors: {', '.join(parsed_transcript.negative_lifestyle_factors) if parsed_transcript.negative_lifestyle_factors else 'None'}

            EXTRACTION NOTES:
            - Notes: {', '.join(parsed_transcript.extraction_notes) if parsed_transcript.extraction_notes else 'None'}
            """
        return patient_info
    
    async def _eligibility_filter_agent(self, patient: Patient, parsed_transcript: ParsedTranscript, trials: list[ClinicalTrial]) -> Dict[str, List[str]]:
        """
        Agent 1: Clinical Trials Administrator - Separates trials into eligible and uncertain categories.
        
        Args:
            patient: Patient domain object
            parsed_transcript: Parsed transcript domain object
            trials: List of clinical trials to filter
            
        Returns:
            Dict[str, List[str]]: Dictionary with 'eligible_trial_ids' and 'uncertain_trial_ids' lists
        """
        # Prepare comprehensive patient information
        patient_info = self._create_comprehensive_patient_info(patient, parsed_transcript)
        
        # Prepare trial eligibility information (focus only on eligibility criteria and title)
        trials_text = ""
        for i, trial in enumerate(trials, 1):
            trials_text += f"""
                TRIAL {i} - {trial.external_id}:
                - Title: {trial.brief_title}
                - Eligibility Criteria: {trial.eligibility_criteria or 'No eligibility criteria available'}
                """

        prompt = f"""
            You are a Senior Clinical Trials Administrator with 15+ years of experience in patient eligibility screening. Your expertise is in carefully analyzing eligibility criteria and determining patient inclusion/exclusion.

            {patient_info}

            CLINICAL TRIALS TO EVALUATE:
            {trials_text}

            YOUR TASK:
            Carefully evaluate each trial's eligibility criteria against the patient profile. Separate trials into two categories:

            FOCUS ON:
            1. **Eligibility Criteria** (PRIMARY) - This is your main focus
            2. **Trial Title** (SECONDARY) - Only if eligibility criteria are unclear

            ELIGIBLE TRIALS:
            - Trials where the patient CLEARLY/LIKELY meets the eligibility criteria
            - Patient does not meet any of the exclusion criteria
            - Patient's age, sex, conditions, and medications all align with requirements

            UNCERTAIN TRIALS:
            - Trials where there is more doubt about patient eligibility, but not explicitly excluded by the eligibility criteria
            - Eligibility criteria are unclear or ambiguous
            - Patient's profile partially matches but some details are uncertain

            EXCLUSION RULES (trials to completely exclude):
            - Trials where the patient's age is clearly outside the specified range
            - Trials where the patient's sex doesn't match requirements
            - Trials where the patient takes medications that are explicitly excluded
            - Trials where the patient doesn't have the required conditions
            - Trials where the patient has conditions that are explicitly excluded

            RESPONSE FORMAT:
            Return ONLY a JSON object with two lists:

            {{
                "eligible_trial_ids": ["NCT12345678", "NCT87654321", ...],
                "uncertain_trial_ids": ["NCT11111111", "NCT22222222", ...]
            }}

            If no trials are eligible or uncertain, return empty arrays: {{"eligible_trial_ids": [], "uncertain_trial_ids": []}}

            IMPORTANT: Be thorough but fair. When in doubt about eligibility, put the trial in the uncertain category rather than excluding it entirely.
            """

        try:
            response = self.llm_adapter.call_llm_json(prompt, temperature=0.1)  # Low temperature for consistency
            
            if isinstance(response, dict) and "eligible_trial_ids" in response and "uncertain_trial_ids" in response:
                return {
                    "eligible_trial_ids": response["eligible_trial_ids"],
                    "uncertain_trial_ids": response["uncertain_trial_ids"]
                }
            else:
                logger.warning("Eligibility agent response format unexpected, returning empty lists")
                return {"eligible_trial_ids": [], "uncertain_trial_ids": []}
                
        except Exception as e:
            logger.error(f"Error in eligibility filter agent: {e}")
            # Fallback: return empty lists if agent fails
            return {"eligible_trial_ids": [], "uncertain_trial_ids": []}
    
    async def _relevance_ranking_agent(self, patient: Patient, parsed_transcript: ParsedTranscript, trials: list[ClinicalTrial], trial_ids: list[str], category: str) -> list[str]:
        """
        Agent 2: Clinical Research Coordinator - Ranks trials by relevance and match quality.
        
        Args:
            patient: Patient domain object
            parsed_transcript: Parsed transcript domain object
            trials: List of all clinical trials
            trial_ids: List of trial IDs to rank (either eligible or uncertain)
            category: Category of trials being ranked ("eligible" or "uncertain")
            
        Returns:
            list[str]: List of external_ids ranked by relevance (most relevant first)
        """
        # Filter trials to only include the specified ones
        filtered_trials = [t for t in trials if t.external_id in trial_ids]
        
        # Prepare comprehensive patient information
        patient_info = self._create_comprehensive_patient_info(patient, parsed_transcript)
        
        # Prepare trial information
        trials_text = ""
        for i, trial in enumerate(filtered_trials, 1):
            trials_text += f"""
TRIAL {i} - {trial.external_id}:
- Official Title: {trial.official_title}
- Conditions: {', '.join(trial.conditions) if trial.conditions else 'Not specified'}
- Brief Summary: {trial.brief_summary or 'No summary available'}
- Eligibility Criteria: {trial.eligibility_criteria or 'No eligibility criteria available'}
"""

        category_context = "ELIGIBLE" if category == "eligible" else "UNCERTAIN"
        
        prompt = f"""
You are a Senior Clinical Research Coordinator with 10+ years of experience in patient-trial matching. Your expertise is in evaluating how well clinical trials match patient needs and clinical relevance.

{patient_info}

{category_context} CLINICAL TRIALS TO RANK:
{trials_text}

YOUR TASK:
Rank these {category.lower()} trials by how well they match the patient's clinical needs and relevance. Consider:

RANKING FACTORS (in order of importance):
1. **Brief Summary Relevance**: How well the trial's brief summary (which describes the purpose of the study) matches the patient's clinical needs and context
2. **Condition Match**: How well the trial's conditions match the patient's conditions
3. **Treatment Relevance**: How relevant the trial's treatment approach is to the patient's needs
4. **Geographic Accessibility**: Consider patient location if specified
5. **Burden vs. Benefit**: Balance trial requirements with potential benefits

RANKING RULES:
- Most relevant trials first
- Consider the patient's specific symptoms and treatment history
- Prioritize trials that address the patient's primary conditions
- Consider the patient's age and overall health profile
- Factor in current medications and potential interactions

RESPONSE FORMAT:
Return ONLY a JSON object with the external_ids ranked by relevance (most relevant first):

{{
    "ranked_trial_ids": ["NCT12345678", "NCT87654321", ...]
}}

If no trials are relevant, return: {{"ranked_trial_ids": []}}

IMPORTANT: Focus on clinical relevance and patient benefit. The patient should be able to understand why each trial is recommended for them.
"""

        try:
            response = self.llm_adapter.call_llm_json(prompt, temperature=0.3)  # Slightly higher for ranking creativity
            
            if isinstance(response, dict) and "ranked_trial_ids" in response:
                return response["ranked_trial_ids"]
            else:
                logger.warning(f"Relevance ranking agent response format unexpected, returning {category} trials in original order")
                return trial_ids
                
        except Exception as e:
            logger.error(f"Error in relevance ranking agent: {e}")
            # Fallback: return trials in original order
            return trial_ids
    
    async def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Retrieves a specific clinical trial by ID from the clinical trials adapter.
        
        Args:
            trial_id: ID of the clinical trial
            
        Returns:
            ClinicalTrial: The clinical trial details
            
        Raises:
            TrialNotFoundError: If trial is not found
        """
        return await self.clinical_trials_adapter.get_clinical_trial(trial_id)