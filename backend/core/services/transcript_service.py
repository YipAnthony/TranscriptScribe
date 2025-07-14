import logging
from typing import Optional, Union
from ports.db import DatabasePort
from ports.llm import LLMPort
from domain.parsed_transcript import ParsedTranscript
from domain.exceptions import TranscriptNotFoundError
from logging_config import get_logger

logger = get_logger(__name__)

class TranscriptService:
    def __init__(self, 
                 db_adapter: DatabasePort,
                 llm_adapter: LLMPort):
        self.db_adapter = db_adapter
        self.llm_adapter = llm_adapter
        logger.info("📝 TranscriptService initialized")
    
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
            logger.info(f"🔄 Processing transcript for patient {patient_id}")
            logger.debug(f"📋 Transcript details - length: {len(str(raw_transcript))}, recorded_at: {recorded_at}")
            
            # Analyze transcript using LLM adapter
            logger.info("🧠 Starting transcript analysis with LLM adapter...")
            parsed_transcript = self._analyze_transcript_with_llm(raw_transcript)
            logger.info(f"✅ Transcript analysis completed successfully")
            logger.debug(f"📊 Parsed data summary - conditions: {len(parsed_transcript.conditions)}, medications: {len(parsed_transcript.medications)}, procedures: {len(parsed_transcript.procedures)}")
            
            # Create transcript record in database with parsed data
            logger.info("💾 Storing transcript to database...")
            transcript_id = self.db_adapter.create_transcript(
                patient_id=patient_id,
                parsed_transcript=parsed_transcript,
                recorded_at=recorded_at
            )
            
            logger.info(f"🎉 Transcript processed successfully with ID: {transcript_id}")
            return transcript_id
            
        except Exception as e:
            logger.error(f"❌ Error processing transcript for patient {patient_id}: {e}", exc_info=True)
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
        
        logger.debug("🔄 Starting LLM analysis...")
        
        # Convert dict to string if needed
        if isinstance(raw_transcript, dict):
            logger.debug("🔄 Converting dict transcript to string...")
            raw_transcript = json.dumps(raw_transcript, indent=2)
        
        # Create analysis prompt (business logic)
        logger.debug("📝 Creating analysis prompt...")
        prompt = self._create_analysis_prompt(raw_transcript)
        logger.debug(f"📝 Prompt created, length: {len(prompt)}")
        
        # Use LLM adapter for the actual API call
        logger.info("🤖 Calling LLM for transcript analysis...")
        try:
            response = self.llm_adapter.call_llm_json(
                prompt=prompt,
                temperature=0.1,  # Low temperature for consistent parsing
                max_tokens=4096  # Increased for comprehensive analysis
            )
            logger.info("✅ LLM response received successfully")
            logger.debug(f"📊 LLM response keys: {list(response.keys()) if isinstance(response, dict) else 'Not a dict'}")
        except Exception as e:
            logger.error(f"❌ LLM call failed: {e}", exc_info=True)
            raise
        
        # Parse the response into ParsedTranscript (business logic)
        logger.debug("🔍 Parsing LLM response...")
        try:
            parsed_transcript = self._parse_llm_response(response)
            logger.info("✅ LLM response parsed successfully")
        except Exception as e:
            logger.error(f"❌ Failed to parse LLM response: {e}", exc_info=True)
            logger.error(f"📋 Raw LLM response: {response}")
            raise
        
        logger.info(f"🎯 Successfully analyzed transcript")
        return parsed_transcript
    
    def _create_analysis_prompt(self, raw_transcript: str) -> str:
        """Create the prompt for transcript analysis - business logic"""
        return f"""
            You are a medical transcript analyzer. Your task is to extract comprehensive structured information from the following medical transcript.

            Please analyze the transcript and extract the following information:

            **CORE MEDICAL INFORMATION:**
            1. **Medical Conditions**: Only include medical conditions or diagnoses that are explicitly diagnosed or confirmed by the provider or patient. Do NOT include suspected, possible, or likely diagnoses.
            2. **Medications**: Only include specific medications that are actually prescribed, administered, or recommended. Do NOT include dosages, frequencies, or instructions—just the medication name.
            3. **Procedures**: Only include specific medical procedures, surgeries, or treatments that are actually performed or recommended.

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
                - Past diagnoses: previous medical conditions
                - Past surgeries: previous surgical procedures
            11. **Family History**: relevant family medical history
            12. **Lifestyle Factors**:
                - Positive lifestyle factors: healthy behaviors, good habits
                - Negative lifestyle factors: risk factors, unhealthy behaviors

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
    