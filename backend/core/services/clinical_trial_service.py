from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial
from ports.db import DatabasePort
from ports.clinical_trials import ClinicalTrialsPort
from ports.llm import LLMPort
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError
import json
import logging

logger = logging.getLogger(__name__)

class ClinicalTrialService:
    def __init__(self, db_adapter: DatabasePort, clinical_trials_adapter: ClinicalTrialsPort, llm_adapter: LLMPort):
        self.db_adapter = db_adapter
        self.clinical_trials_adapter = clinical_trials_adapter
        self.llm_adapter = llm_adapter
    
    def find_recommended_trials(self, patient_id: str, transcript_id: str) -> list[ClinicalTrial]:
        """
        Find recommended clinical trials based on patient profile and appointment transcript.
        Uses a multi-agent approach with specialized agents for eligibility filtering and relevance ranking.
        
        Args:
            patient_id: ID of the patient
            transcript_id: ID of the transcript
            
        Returns:
            list[ClinicalTrial]: List of recommended clinical trials ranked by relevance
            
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
        initial_trials = self.clinical_trials_adapter.find_recommended_clinical_trials(patient, parsed_transcript)
        logger.info(f"Found {len(initial_trials)} initial clinical trials")
        
        if not initial_trials:
            logger.info("No clinical trials found, returning empty list")
            return []
        
        # 3. Agent 1: Eligibility Filter Agent - Filter out ineligible trials
        logger.info("Agent 1: Filtering trials by eligibility criteria")
        eligible_trial_ids = self._eligibility_filter_agent(patient, parsed_transcript, initial_trials)
        logger.info(f"Eligibility filter: {len(eligible_trial_ids)} trials passed screening")
        
        if not eligible_trial_ids:
            logger.info("No eligible trials found after screening")
            return []
        
        # 4. Agent 2: Relevance Ranking Agent - Rank eligible trials by relevance
        logger.info("Agent 2: Ranking trials by relevance")
        ranked_trial_ids = self._relevance_ranking_agent(patient, parsed_transcript, initial_trials, eligible_trial_ids)
        logger.info(f"Relevance ranking: {len(ranked_trial_ids)} trials ranked by relevance")
        
        # 5. Restructure response to include only ranked trials in order
        logger.info(f"Returning {len(ranked_trial_ids)} recommended clinical trials")
        recommended_trials = []
        for trial_id in ranked_trial_ids:
            for trial in initial_trials:
                if trial.external_id == trial_id:
                    recommended_trials.append(trial)
                    break
        
        return recommended_trials
    
    def _eligibility_filter_agent(self, patient: Patient, parsed_transcript: ParsedTranscript, trials: list[ClinicalTrial]) -> list[str]:
        """
        Agent 1: Clinical Trials Administrator - Filters trials based on eligibility criteria only.
        
        Args:
            patient: Patient domain object
            parsed_transcript: Parsed transcript domain object
            trials: List of clinical trials to filter
            
        Returns:
            list[str]: List of external_ids that pass eligibility screening
        """
        # Prepare patient information for eligibility assessment
        patient_info = f"""
PATIENT ELIGIBILITY PROFILE:
- Age: {parsed_transcript.age or 'Not specified'}
- Sex: {parsed_transcript.sex or 'Not specified'}
- Current Conditions: {', '.join(parsed_transcript.conditions) if parsed_transcript.conditions else 'None'}
- Current Medications: {', '.join(parsed_transcript.medications) if parsed_transcript.medications else 'None'}
- Past Diagnoses: {', '.join(parsed_transcript.past_diagnoses) if parsed_transcript.past_diagnoses else 'None'}
- Past Surgeries: {', '.join(parsed_transcript.past_surgeries) if parsed_transcript.past_surgeries else 'None'}
- Family History: {', '.join(parsed_transcript.family_history) if parsed_transcript.family_history else 'None'}
"""

        # Prepare trial eligibility information
        trials_text = ""
        for i, trial in enumerate(trials, 1):
            trials_text += f"""
TRIAL {i} - {trial.external_id}:
- Title: {trial.brief_title}
- Eligibility Criteria: {trial.eligibility_criteria or 'No eligibility criteria available'}
- Status: {trial.status}
- Phases: {', '.join(trial.phases) if trial.phases else 'Not specified'}
"""

        prompt = f"""
You are a Senior Clinical Trials Administrator with 15+ years of experience in patient eligibility screening. Your expertise is in carefully analyzing eligibility criteria and determining patient inclusion/exclusion.

{patient_info}

CLINICAL TRIALS TO EVALUATE:
{trials_text}

YOUR TASK:
Carefully evaluate each trial's eligibility criteria against the patient profile. Your ONLY job is to determine if the patient meets the basic eligibility requirements.

INCLUSION RULES:
- Include trials where the patient CLEARLY meets the eligibility criteria
- Be conservative - if there's any doubt about eligibility, EXCLUDE the trial
- Pay special attention to age ranges, sex requirements, medication exclusions, and condition requirements

EXCLUSION RULES:
- Exclude trials where the patient's age is outside the specified range
- Exclude trials where the patient's sex doesn't match requirements
- Exclude trials where the patient takes medications that are explicitly excluded
- Exclude trials where the patient doesn't have the required conditions
- Exclude completed or terminated trials

RESPONSE FORMAT:
Return ONLY a JSON object with the external_ids of trials that pass eligibility screening:

{{
    "eligible_trial_ids": ["NCT12345678", "NCT87654321", ...]
}}

If no trials are eligible, return: {{"eligible_trial_ids": []}}

IMPORTANT: Be extremely thorough in your eligibility assessment. It's better to exclude a trial than to include an ineligible patient.
"""

        try:
            response = self.llm_adapter.call_llm_json(prompt, temperature=0.1)  # Low temperature for consistency
            
            if isinstance(response, dict) and "eligible_trial_ids" in response:
                return response["eligible_trial_ids"]
            else:
                logger.warning("Eligibility agent response format unexpected, excluding all trials")
                return []
                
        except Exception as e:
            logger.error(f"Error in eligibility filter agent: {e}")
            # Fallback: exclude all trials if agent fails
            return []
    
    def _relevance_ranking_agent(self, patient: Patient, parsed_transcript: ParsedTranscript, trials: list[ClinicalTrial], eligible_trial_ids: list[str]) -> list[str]:
        """
        Agent 2: Clinical Research Coordinator - Ranks eligible trials by relevance and match quality.
        
        Args:
            patient: Patient domain object
            parsed_transcript: Parsed transcript domain object
            trials: List of all clinical trials
            eligible_trial_ids: List of trial IDs that passed eligibility screening
            
        Returns:
            list[str]: List of external_ids ranked by relevance (most relevant first)
        """
        # Filter trials to only include eligible ones
        eligible_trials = [t for t in trials if t.external_id in eligible_trial_ids]
        
        # Prepare patient information for relevance assessment
        patient_info = f"""
PATIENT CLINICAL PROFILE:
- Age: {parsed_transcript.age or 'Not specified'}
- Sex: {parsed_transcript.sex or 'Not specified'}
- Current Conditions: {', '.join(parsed_transcript.conditions) if parsed_transcript.conditions else 'None'}
- Current Medications: {', '.join(parsed_transcript.medications) if parsed_transcript.medications else 'None'}
- Procedures: {', '.join(parsed_transcript.procedures) if parsed_transcript.procedures else 'None'}
- Positive Symptoms: {', '.join(parsed_transcript.positive_symptoms) if parsed_transcript.positive_symptoms else 'None'}
- Past Diagnoses: {', '.join(parsed_transcript.past_diagnoses) if parsed_transcript.past_diagnoses else 'None'}
- Treatment Needs: Based on conditions and symptoms
"""

        # Prepare eligible trial information
        trials_text = ""
        for i, trial in enumerate(eligible_trials, 1):
            trials_text += f"""
TRIAL {i} - {trial.external_id}:
- Title: {trial.brief_title}
- Official Title: {trial.official_title}
- Conditions: {', '.join(trial.conditions) if trial.conditions else 'Not specified'}
- Brief Summary: {trial.brief_summary or 'No summary available'}
- Eligibility Criteria: {trial.eligibility_criteria or 'No eligibility criteria available'}
- Status: {trial.status}
- Phases: {', '.join(trial.phases) if trial.phases else 'Not specified'}
- Sponsor: {trial.sponsor_name}
"""

        prompt = f"""
You are a Senior Clinical Research Coordinator with 10+ years of experience in patient-trial matching. Your expertise is in evaluating how well clinical trials match patient needs and clinical relevance.

{patient_info}

ELIGIBLE CLINICAL TRIALS TO RANK:
{trials_text}

YOUR TASK:
Rank these eligible trials by how well they match the patient's clinical needs and relevance. Consider:

RANKING FACTORS (in order of importance):
1. **Condition Match**: How well the trial's conditions match the patient's conditions
2. **Treatment Relevance**: How relevant the trial's treatment approach is to the patient's needs
3. **Phase Appropriateness**: Whether the trial phase is appropriate for the patient's condition
4. **Recruitment Status**: Active recruitment is preferred
5. **Geographic Accessibility**: Consider patient location if specified
6. **Burden vs. Benefit**: Balance trial requirements with potential benefits

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
                logger.warning("Relevance ranking agent response format unexpected, returning eligible trials in original order")
                return eligible_trial_ids
                
        except Exception as e:
            logger.error(f"Error in relevance ranking agent: {e}")
            # Fallback: return eligible trials in original order
            return eligible_trial_ids
    
    def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Retrieves a specific clinical trial by ID from the clinical trials adapter.
        
        Args:
            trial_id: ID of the clinical trial
            
        Returns:
            ClinicalTrial: The clinical trial details
            
        Raises:
            TrialNotFoundError: If trial is not found
        """
        return self.clinical_trials_adapter.get_clinical_trial(trial_id)