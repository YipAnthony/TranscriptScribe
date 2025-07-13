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
            # Convert parsed transcript to JSON-serializable format
            location_data = None
            if parsed_transcript.location:
                location_data = {
                    "street": parsed_transcript.location.street,
                    "city": parsed_transcript.location.city,
                    "state": parsed_transcript.location.state,
                    "zip_code": parsed_transcript.location.zip_code,
                    "country": parsed_transcript.location.country
                }
            
            parsed_data = {
                "conditions": parsed_transcript.conditions,
                "interventions": parsed_transcript.interventions,
                "location": location_data,
                "sex": parsed_transcript.sex,
                "age": parsed_transcript.age
            }
            
            transcript_data = {
                "patient_id": patient_id,
                "parsed_transcript": parsed_data,
                "recorded_at": recorded_at,
                "status": "COMPLETED"
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
                return self._dict_to_parsed_transcript(transcript_data["parsed_transcript"])
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
            # Convert parsed transcript to JSON-serializable format
            location_data = None
            if parsed_transcript.location:
                location_data = {
                    "street": parsed_transcript.location.street,
                    "city": parsed_transcript.location.city,
                    "state": parsed_transcript.location.state,
                    "zip_code": parsed_transcript.location.zip_code,
                    "country": parsed_transcript.location.country
                }
            
            parsed_data = {
                "conditions": parsed_transcript.conditions,
                "interventions": parsed_transcript.interventions,
                "location": location_data,
                "sex": parsed_transcript.sex,
                "age": parsed_transcript.age
            }
            
            update_data = {
                "parsed_transcript": parsed_data,
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
    
    def _dict_to_parsed_transcript(self, parsed_data: Dict[str, Any]) -> ParsedTranscript:
        """Convert database dict to ParsedTranscript domain object"""
        location = None
        if parsed_data.get("location"):
            location_data = parsed_data["location"]
            location = Address(
                street=location_data.get("street"),
                city=location_data.get("city"),
                state=location_data.get("state"),
                zip_code=location_data.get("zip_code"),
                country=location_data.get("country")
            )
        
        return ParsedTranscript(
            conditions=parsed_data.get("conditions", []),
            interventions=parsed_data.get("interventions", []),
            location=location,
            sex=parsed_data.get("sex"),
            age=parsed_data.get("age")
        )