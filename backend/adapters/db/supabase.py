import os
import json
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from supabase import create_client, Client
from ports.db import DatabasePort
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address
from domain.patient import Patient
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError

logger = logging.getLogger(__name__)

class SupabaseAdapter(DatabasePort):
    def __init__(self):
        """Initialize Supabase client"""
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized")
    
    # Patient methods
    def get_patient(self, patient_id: str) -> Patient:
        """Get patient by ID"""
        try:
            result = self.client.table("patients").select("*, addresses(*)").eq("id", patient_id).execute()
            
            if result.data:
                patient_data = result.data[0]
                return self._dict_to_patient(patient_data)
            else:
                raise PatientNotFoundError(f"Patient with ID {patient_id} not found")
                
        except PatientNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting patient {patient_id}: {e}")
            raise
    
    # Transcript methods
    def create_transcript(self, patient_id: str, parsed_transcript: ParsedTranscript, recorded_at: Optional[str] = None) -> str:
        """Create a new transcript record"""
        try:
            # Flatten location fields
            location = parsed_transcript.location
            transcript_data = {
                "patient_id": patient_id,
                "recorded_at": recorded_at,
                "status": "COMPLETED",
                "conditions": parsed_transcript.conditions,
                "medications": parsed_transcript.medications,
                "procedures": parsed_transcript.procedures,
                "street": location.street if location else None,
                "city": location.city if location else None,
                "state": location.state if location else None,
                "zip_code": location.zip_code if location else None,
                "country": location.country if location else None,
                "sex": parsed_transcript.sex,
                "age": parsed_transcript.age,
                "positive_symptoms": parsed_transcript.positive_symptoms,
                "negative_symptoms": parsed_transcript.negative_symptoms,
                "positive_lab_results": parsed_transcript.positive_lab_results,
                "negative_lab_results": parsed_transcript.negative_lab_results,
                "positive_imaging_results": parsed_transcript.positive_imaging_results,
                "negative_imaging_results": parsed_transcript.negative_imaging_results,
                "past_diagnoses": parsed_transcript.past_diagnoses,
                "past_surgeries": parsed_transcript.past_surgeries,
                "family_history": parsed_transcript.family_history,
                "positive_lifestyle_factors": parsed_transcript.positive_lifestyle_factors,
                "negative_lifestyle_factors": parsed_transcript.negative_lifestyle_factors,
                "extraction_notes": parsed_transcript.extraction_notes
            }
            result = self.client.table("transcripts").insert(transcript_data).execute()
            if result.data:
                transcript_id = result.data[0]["id"]
                logger.info(f"Created transcript with ID: {transcript_id}")
                return transcript_id
            else:
                raise Exception("Failed to create transcript - no data returned")
        except Exception as e:
            logger.error(f"Error creating transcript: {e}")
            raise

    def get_transcript(self, transcript_id: str) -> ParsedTranscript:
        """Get transcript by ID"""
        try:
            result = self.client.table("transcripts").select("*").eq("id", transcript_id).execute()
            if result.data:
                transcript_data = result.data[0]
                return self._row_to_parsed_transcript(transcript_data)
            else:
                raise TranscriptNotFoundError(f"Transcript with ID {transcript_id} not found")
        except TranscriptNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error getting transcript {transcript_id}: {e}")
            raise
    
    def update_transcript_status(self, transcript_id: str, status: str) -> None:
        """Update transcript status"""
        try:
            result = self.client.table("transcripts").update({"status": status}).eq("id", transcript_id).execute()
            
            if not result.data:
                raise Exception(f"Transcript with ID {transcript_id} not found")
                
            logger.info(f"Updated transcript {transcript_id} status to: {status}")
            
        except Exception as e:
            logger.error(f"Error updating transcript status {transcript_id}: {e}")
            raise
    
    def update_parsed_transcript(self, transcript_id: str, parsed_transcript: ParsedTranscript) -> None:
        """Update transcript with parsed data"""
        try:
            location = parsed_transcript.location
            update_data = {
                "conditions": parsed_transcript.conditions,
                "medications": parsed_transcript.medications,
                "procedures": parsed_transcript.procedures,
                "street": location.street if location else None,
                "city": location.city if location else None,
                "state": location.state if location else None,
                "zip_code": location.zip_code if location else None,
                "country": location.country if location else None,
                "sex": parsed_transcript.sex,
                "age": parsed_transcript.age,
                "positive_symptoms": parsed_transcript.positive_symptoms,
                "negative_symptoms": parsed_transcript.negative_symptoms,
                "positive_lab_results": parsed_transcript.positive_lab_results,
                "negative_lab_results": parsed_transcript.negative_lab_results,
                "positive_imaging_results": parsed_transcript.positive_imaging_results,
                "negative_imaging_results": parsed_transcript.negative_imaging_results,
                "past_diagnoses": parsed_transcript.past_diagnoses,
                "past_surgeries": parsed_transcript.past_surgeries,
                "family_history": parsed_transcript.family_history,
                "positive_lifestyle_factors": parsed_transcript.positive_lifestyle_factors,
                "negative_lifestyle_factors": parsed_transcript.negative_lifestyle_factors,
                "extraction_notes": parsed_transcript.extraction_notes,
                "status": "COMPLETED"
            }
            result = self.client.table("transcripts").update(update_data).eq("id", transcript_id).execute()
            if not result.data:
                raise Exception(f"Transcript with ID {transcript_id} not found")
            logger.info(f"Updated transcript {transcript_id} with parsed data")
        except Exception as e:
            logger.error(f"Error updating parsed transcript {transcript_id}: {e}")
            raise
    
    def delete_transcript(self, transcript_id: str) -> None:
        """Delete a transcript record"""
        try:
            result = self.client.table("transcripts").delete().eq("id", transcript_id).execute()
            
            if not result.data:
                raise Exception(f"Transcript with ID {transcript_id} not found")
                
            logger.info(f"Deleted transcript with ID: {transcript_id}")
            
        except Exception as e:
            logger.error(f"Error deleting transcript {transcript_id}: {e}")
            raise
    
    def _dict_to_patient(self, patient_data: Dict[str, Any]) -> Patient:
        """Convert database dict to Patient domain object"""
        from datetime import date
        
        # Parse date_of_birth if it exists
        date_of_birth = None
        if patient_data.get("date_of_birth"):
            try:
                date_of_birth = date.fromisoformat(patient_data["date_of_birth"])
            except:
                date_of_birth = None
        
        # Parse address if it exists
        address = None
        if patient_data.get("addresses"):
            address_data = patient_data["addresses"]
            address = Address(
                street=address_data.get("street"),
                city=address_data.get("city"),
                state=address_data.get("state"),
                zip_code=address_data.get("zip_code"),
                country=address_data.get("country")
            )
        
        return Patient(
            id=patient_data["id"],
            external_id=patient_data["external_id"],
            first_name=patient_data["first_name"],
            last_name=patient_data["last_name"],
            date_of_birth=date_of_birth,
            sex=patient_data.get("sex"),
            email=patient_data.get("email"),
            phone=patient_data.get("phone"),
            address=address
        )
    
    def _row_to_parsed_transcript(self, row: Dict[str, Any]) -> ParsedTranscript:
        location = Address(
            street=row.get("street"),
            city=row.get("city"),
            state=row.get("state"),
            zip_code=row.get("zip_code"),
            country=row.get("country")
        ) if row.get("street") else None
        return ParsedTranscript(
            conditions=row.get("conditions", []),
            medications=row.get("medications", []),
            procedures=row.get("procedures", []),
            location=location,
            sex=row.get("sex"),
            age=row.get("age"),
            positive_symptoms=row.get("positive_symptoms", []),
            negative_symptoms=row.get("negative_symptoms", []),
            positive_lab_results=row.get("positive_lab_results", []),
            negative_lab_results=row.get("negative_lab_results", []),
            positive_imaging_results=row.get("positive_imaging_results", []),
            negative_imaging_results=row.get("negative_imaging_results", []),
            past_diagnoses=row.get("past_diagnoses", []),
            past_surgeries=row.get("past_surgeries", []),
            family_history=row.get("family_history", []),
            positive_lifestyle_factors=row.get("positive_lifestyle_factors", []),
            negative_lifestyle_factors=row.get("negative_lifestyle_factors", []),
            extraction_notes=row.get("extraction_notes", [])
        )