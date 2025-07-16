import logging
from typing import Optional, Union
from domain.patient import Patient
from ports.db import DatabasePort
from ports.llm import LLMPort
from domain.parsed_transcript import ParsedTranscript
from domain.exceptions import TranscriptNotFoundError, PatientNotFoundError
from datetime import date

logger = logging.getLogger(__name__)

class TranscriptService:
    def __init__(self, 
                 db_adapter: DatabasePort,
                 llm_adapter: LLMPort):
        self.db_adapter = db_adapter
        self.llm_adapter = llm_adapter
    
    def process_raw_transcript(self, patient_id: str, raw_transcript: Union[str, dict], recorded_at: Optional[str] = None) -> str:
        """
        Processes a raw transcript using the LLM adapter and stores it to the database.
        
        Args:
            patient_id: ID of the patient this transcript belongs to
            raw_transcript: Raw transcript text or JSON dict
            recorded_at: Optional timestamp when transcript was recorded
            
        Returns:
            str: The created transcript ID
        """
        try:
            logger.info(f"Processing transcript for patient {patient_id}")
            
            # Analyze transcript using LLM adapter
            logger.info("Starting transcript analysis with LLM adapter...")
            parsed_transcript = self._analyze_transcript_with_llm(raw_transcript)
            logger.info(f"Transcript analysis completed: {parsed_transcript}")
            
            # Create transcript record in database with parsed data
            logger.info("Storing transcript to database...")
            transcript_id = self.db_adapter.create_transcript(
                patient_id=patient_id,
                parsed_transcript=parsed_transcript,
                recorded_at=recorded_at
            )
            
            logger.info(f"Transcript processed successfully with ID: {transcript_id}")
            return transcript_id
            
        except Exception as e:
            logger.error(f"Error processing transcript for patient {patient_id}: {e}")
            raise e
    
    def _analyze_transcript_with_llm(self, raw_transcript: Union[str, dict]) -> ParsedTranscript:
        """
        Analyze patient/provider transcript using the injectedLLM adapter. 
        
        Args:
            raw_transcript: Raw transcript as string or JSON dict
            
        Returns:
            ParsedTranscript: Structured ParsedTranscript domain model with extracted information
        """
        import json
        
        # Convert dict to string if needed
        if isinstance(raw_transcript, dict):
            raw_transcript = json.dumps(raw_transcript, indent=2)
        
        # Create analysis prompt (business logic)
        prompt = self._create_analysis_prompt(raw_transcript)
        
        # Use LLM adapter for the actual API call
        response = self.llm_adapter.call_llm_json(
            prompt=prompt,
            temperature=0.1,  # Low temperature for consistent parsing
            max_tokens=4096  # Increased for comprehensive analysis
        )
        
        # Parse the response into ParsedTranscript (business logic)
        parsed_transcript = self._parse_llm_response(response)
        
        logger.info(f"Successfully analyzed transcript: {parsed_transcript}")
        return parsed_transcript
    
    def _create_analysis_prompt(self, raw_transcript: str) -> str:
        """Create the prompt for transcript analysis - business logic"""
        return f"""
            You are a medical transcript analyzer. Your task is to extract comprehensive structured information from the following medical transcript.

            Please analyze the transcript and extract the following information:

            **CORE MEDICAL INFORMATION:**
            1. **Medical Conditions**: Only include medical conditions or diagnoses that are explicitly diagnosed or confirmed by the provider or patient. Use SPECIFIC medical terminology rather than general descriptions. For example:
               - Use "hypertension" instead of "high blood pressure"
               - Use "diabetes mellitus" instead of "diabetes"
               - Use "myocardial infarction" instead of "heart attack"
               - Use "cerebrovascular accident" instead of "stroke"
               - Use "chronic obstructive pulmonary disease" instead of "COPD"
               Do NOT include suspected, possible, or likely diagnoses.
            2. **Medications**: Only include specific medications that are actually prescribed, administered, or recommended. Use generic names when possible. Do NOT include dosages, frequencies, or instructions—just the medication name.
            3. **Procedures**: Only include specific medical procedures, surgeries, or treatments that are actually performed or recommended. Use standard medical terminology.

            **DEMOGRAPHICS:**
            4. **Age**: Extract patient age if mentioned
            5. **Sex**: Extract patient sex (MALE or FEMALE) if mentioned

            **LOCATION:**
            6. **Location**: Extract any location details (city, state, country, zip code) if mentioned

            **COMPREHENSIVE MEDICAL RECORD:**
            7. **Symptoms**: 
            - Positive symptoms: symptoms the patient is experiencing
            - Negative symptoms: symptoms the patient denies or reports as absent
            8. **Lab Results**:
            - Positive lab results: abnormal or significant lab findings
            - Negative lab results: normal lab results or negative findings
            9. **Imaging Results**:
            - Positive imaging results: abnormal or significant imaging findings
            - Negative imaging results: normal imaging results or negative findings
            10. **Medical History**:
                - Past diagnoses: previous medical conditions (use specific terminology)
                - Past surgeries: previous surgical procedures
            11. **Family History**: relevant family medical history
            12. **Lifestyle Factors**:
                - Positive lifestyle factors: healthy behaviors, good habits
                - Negative lifestyle factors: risk factors, unhealthy behaviors

            **IMPORTANT GUIDELINES:**
            - Always prefer specific medical terminology over general descriptions
            - Use standard ICD-10 or medical dictionary terms when possible
            - For conditions, focus on definitive diagnoses rather than symptoms
            - Be precise and avoid colloquial medical terms

            IMPORTANT: Respond with valid JSON only in the following format:
            {{
                "conditions": ["condition1", "condition2"],
                "medications": ["medication1", "medication2"],
                "procedures": ["procedure1", "procedure2"],
                "age": 45,
                "sex": "MALE",
                "location": {{
                    "city": "New York",
                    "state": "NY",
                    "country": "USA",
                    "zip_code": "10001"
                }},
                "positive_symptoms": ["symptom1", "symptom2"],
                "negative_symptoms": ["symptom3", "symptom4"],
                "positive_lab_results": ["lab_result1", "lab_result2"],
                "negative_lab_results": ["lab_result3", "lab_result4"],
                "positive_imaging_results": ["imaging_result1", "imaging_result2"],
                "negative_imaging_results": ["imaging_result3", "imaging_result4"],
                "past_diagnoses": ["diagnosis1", "diagnosis2"],
                "past_surgeries": ["surgery1", "surgery2"],
                "family_history": ["family_condition1", "family_condition2"],
                "positive_lifestyle_factors": ["factor1", "factor2"],
                "negative_lifestyle_factors": ["factor3", "factor4"],
                "extraction_notes": ["note1", "note2"]
            }}

            If any field is not found in the transcript, use null or empty arrays as appropriate. Only include information that is explicitly mentioned or can be reasonably inferred from the transcript.

            TRANSCRIPT TO ANALYZE:
            {raw_transcript}

            JSON RESPONSE:
            """
    
    def _parse_llm_response(self, response: dict) -> ParsedTranscript:
        """Parse LLM response into ParsedTranscript object - business logic"""
        try:
            from domain.address import Address
            
            # Extract core medical information
            conditions = response.get("conditions", [])
            if conditions is None:
                conditions = []
            
            medications = response.get("medications", [])
            if medications is None:
                medications = []
            
            procedures = response.get("procedures", [])
            if procedures is None:
                procedures = []
            
            # Extract demographics
            age = response.get("age")
            sex = response.get("sex")
            
            # Extract location
            location_data = response.get("location")
            location = None
            if location_data and isinstance(location_data, dict):
                location = Address(
                    street=location_data.get("street"),
                    city=location_data.get("city"),
                    state=location_data.get("state"),
                    zip_code=location_data.get("zip_code"),
                    country=location_data.get("country")
                )
            
            # Extract comprehensive medical record
            positive_symptoms = response.get("positive_symptoms", [])
            if positive_symptoms is None:
                positive_symptoms = []
            
            negative_symptoms = response.get("negative_symptoms", [])
            if negative_symptoms is None:
                negative_symptoms = []
            
            positive_lab_results = response.get("positive_lab_results", [])
            if positive_lab_results is None:
                positive_lab_results = []
            
            negative_lab_results = response.get("negative_lab_results", [])
            if negative_lab_results is None:
                negative_lab_results = []
            
            positive_imaging_results = response.get("positive_imaging_results", [])
            if positive_imaging_results is None:
                positive_imaging_results = []
            
            negative_imaging_results = response.get("negative_imaging_results", [])
            if negative_imaging_results is None:
                negative_imaging_results = []
            
            past_diagnoses = response.get("past_diagnoses", [])
            if past_diagnoses is None:
                past_diagnoses = []
            
            past_surgeries = response.get("past_surgeries", [])
            if past_surgeries is None:
                past_surgeries = []
            
            family_history = response.get("family_history", [])
            if family_history is None:
                family_history = []
            
            positive_lifestyle_factors = response.get("positive_lifestyle_factors", [])
            if positive_lifestyle_factors is None:
                positive_lifestyle_factors = []
            
            negative_lifestyle_factors = response.get("negative_lifestyle_factors", [])
            if negative_lifestyle_factors is None:
                negative_lifestyle_factors = []
            
            # Extract metadata
            extraction_notes = response.get("extraction_notes", [])
            if extraction_notes is None:
                extraction_notes = []
            
            return ParsedTranscript(
                conditions=conditions,
                medications=medications,
                procedures=procedures,
                age=age,
                sex=sex,
                location=location,
                positive_symptoms=positive_symptoms,
                negative_symptoms=negative_symptoms,
                positive_lab_results=positive_lab_results,
                negative_lab_results=negative_lab_results,
                positive_imaging_results=positive_imaging_results,
                negative_imaging_results=negative_imaging_results,
                past_diagnoses=past_diagnoses,
                past_surgeries=past_surgeries,
                family_history=family_history,
                positive_lifestyle_factors=positive_lifestyle_factors,
                negative_lifestyle_factors=negative_lifestyle_factors,
                extraction_notes=extraction_notes
            )
            
        except Exception as e:
            logger.error(f"Error parsing LLM response: {e}")
            logger.error(f"Response was: {response}")
            raise e
    
    def get_transcript(self, transcript_id: str) -> ParsedTranscript:
        """
        Get transcript by ID
        
        Args:
            transcript_id: Unique identifier for the transcript
            
        Returns:
            ParsedTranscript: Transcript data
            
        Raises:
            TranscriptNotFoundError: If transcript is not found
        """
        return self.db_adapter.get_transcript(transcript_id)
    
    def generate_fake_transcript(self, patient_id: str) -> str:
        """
        Generate a fake patient-doctor conversation transcript based on patient information.
        
        Args:
            patient_id: ID of the patient to generate transcript for
            
        Returns:
            str: Generated fake transcript as plain text (not markdown)
            
        Raises:
            PatientNotFoundError: If patient is not found
        """
        try:
            logger.info(f"Generating fake transcript for patient {patient_id}")
            
            # Get patient information from database
            patient = self.db_adapter.get_patient(patient_id)
            logger.info(f"Retrieved patient information: {patient}")
            
            # Generate fake transcript using LLM
            fake_transcript = self._generate_transcript_with_llm(patient)
            logger.info(f"Successfully generated fake transcript for patient {patient_id}")
            
            return fake_transcript
            
        except Exception as e:
            logger.error(f"Error generating fake transcript for patient {patient_id}: {e}")
            raise e
    
    def _generate_transcript_with_llm(self, patient: Patient) -> str:
        """
        Generate a fake patient-doctor conversation using the LLM adapter.
        
        Args:
            patient: Patient domain object with patient information
            
        Returns:
            str: Generated fake transcript as plain text (not markdown)
        """
        # Create generation prompt with patient information
        prompt = self._create_transcript_generation_prompt(patient)
        
        # Use LLM adapter for the actual API call
        response = self.llm_adapter.call_llm(
            prompt=prompt,
            temperature=0.7,  # Higher temperature for more creative generation
            max_tokens=2048
        )
        
        logger.info(f"Successfully generated fake transcript using LLM")
        return response.content

    def _create_transcript_generation_prompt(self, patient: Patient) -> str:
        """Create the prompt for fake transcript generation - business logic"""
        
        # Build patient information string
        patient_info = f"Patient Name: {patient.first_name} {patient.last_name}"
        
        if patient.date_of_birth:
            today = date.today()
            age = today.year - patient.date_of_birth.year - ((today.month, today.day) < (patient.date_of_birth.month, patient.date_of_birth.day))
            patient_info += f"\nAge: {age} years old"
        
        if patient.sex:
            patient_info += f"\nSex: {patient.sex}"
        
        return f"""
You are a medical AI assistant tasked with generating a realistic fake patient-doctor conversation transcript.

Based on the following patient information, create a natural, realistic conversation between a patient and their doctor during a medical appointment. Focus on talking about a single particular medical condition that is most important to the patient.

PATIENT INFORMATION:
{patient_info}

REQUIREMENTS:
1. Create a realistic conversation that flows naturally
2. Include the patient's demographic information naturally in the conversation
3. Include common medical topics such as:
   - Current symptoms or concerns
   - Medications (current and any changes)
   - Lifestyle factors (diet, exercise, smoking, alcohol)
   - Family medical history
   - Previous diagnoses or conditions
   - Lab results or test findings
   - Treatment recommendations
4. **IMPORTANT: Include definitive diagnoses from the provider** - The doctor should make specific diagnoses using proper medical terminology.
5. **Use specific medical terminology** throughout the conversation, especially from the provider
6. Format the transcript as plain text (no markdown, no bold, no special formatting). Use clear speaker identification, e.g.:

Dr. Smith: Good morning, [Patient Name]. How have you been feeling since our last visit?

[Patient Name]: Good morning, Doctor. I've been doing okay, but I wanted to talk about...

Dr. Smith: I understand. Let's discuss that...

7. Make it approximately 15-25 exchanges between patient and doctor
8. Include realistic medical terminology but keep it accessible
9. Show appropriate doctor-patient rapport and professionalism
10. DO NOT include any introductory or summary text. ONLY output the conversation itself. Do NOT say things like "Here's a realistic patient-doctor conversation transcript based on the provided patient information." Just give the conversation.

Generate a realistic, engaging conversation that would be typical for a medical appointment with this patient.
"""
    