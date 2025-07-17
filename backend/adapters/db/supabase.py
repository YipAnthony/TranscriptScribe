import os
import json
import re
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
from supabase import create_client, Client
from ports.db import DatabasePort
from domain.parsed_transcript import ParsedTranscript
from domain.address import Address
from domain.patient import Patient
from domain.clinical_trial import ClinicalTrial, Location
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError
from domain.chat_session import ChatSession
from domain.chat_message import ChatMessage

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
    
    def _clean_text(self, text: str) -> str:
        """
        Clean LaTeX escape sequences and other formatting artifacts from text
        """
        if not text:
            return text
            
        # Remove LaTeX-style math delimiters
        text = re.sub(r'\\\[(.*?)\\\]', r'\1', text)  # \[text\] -> text
        text = re.sub(r'\\\((.*?)\\\)', r'\1', text)  # \(text\) -> text
        
        # Remove other common LaTeX escape sequences
        text = re.sub(r'\\[a-zA-Z]+', '', text)  # Remove \command sequences
        
        # Clean up extra whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        return text
    
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
    
    # Clinical Trial methods
    def upsert_clinical_trial(self, clinical_trial: ClinicalTrial) -> str:
        """Insert or update a clinical trial record"""
        try:
            # Convert locations to text array
            locations = []
            if clinical_trial.locations:
                for location in clinical_trial.locations:
                    location_str = f"{location.city}, {location.state}"
                    if location.country and location.country != "United States":
                        location_str += f", {location.country}"
                    locations.append(location_str)
            
            clinical_trial_data = {
                "external_id": clinical_trial.external_id,
                "brief_title": clinical_trial.brief_title,
                "status": clinical_trial.status,
                "conditions": clinical_trial.conditions,
                "brief_summary": clinical_trial.brief_summary,
                "locations": locations
            }
            
            # Use upsert to insert or update
            result = self.client.table("clinical_trials").upsert(
                clinical_trial_data, 
                on_conflict="external_id"
            ).execute()
            
            if result.data:
                trial_id = result.data[0]["id"]
                logger.info(f"Upserted clinical trial with ID: {trial_id}")
                return trial_id
            else:
                raise Exception("Failed to upsert clinical trial - no data returned")
        except Exception as e:
            logger.error(f"Error upserting clinical trial: {e}")
            raise
    
    def get_clinical_trial(self, trial_id: str) -> Optional[ClinicalTrial]:
        """Get clinical trial by external ID"""
        try:
            result = self.client.table("clinical_trials").select("*").eq("id", trial_id).execute()
            if result.data:
                trial_data = result.data[0]
                return self._row_to_clinical_trial(trial_data)
            else:
                return None
        except Exception as e:
            logger.error(f"Error getting clinical trial {trial_id}: {e}")
            raise
    
    def upsert_clinical_trials(self, clinical_trials: List[ClinicalTrial]) -> int:
        """
        Bulk insert or update clinical trials
        
        Args:
            clinical_trials: List of ClinicalTrial objects to upsert
            
        Returns:
            int: Number of trials successfully upserted
        """
        try:
            if not clinical_trials:
                logger.info("No clinical trials to upsert")
                return 0
            
            # Prepare data for bulk upsert
            trials_data = []
            for trial in clinical_trials:
                # Convert locations to text array
                locations = []
                if trial.locations:
                    for location in trial.locations:
                        location_str = f"{location.city}, {location.state}"
                        if location.country and location.country != "United States":
                            location_str += f", {location.country}"
                        locations.append(location_str)
                
                trial_data = {
                    "external_id": trial.external_id,
                    "brief_title": trial.brief_title,
                    "status": trial.status,
                    "conditions": trial.conditions,
                    "brief_summary": trial.brief_summary,
                    "locations": locations
                }
                trials_data.append(trial_data)
            
            # Perform bulk upsert
            result = self.client.table("clinical_trials").upsert(
                trials_data, 
                on_conflict="external_id"
            ).execute()
            
            upserted_count = len(result.data) if result.data else 0
            logger.info(f"Successfully upserted {upserted_count} clinical trials")
            return upserted_count
            
        except Exception as e:
            logger.error(f"Error bulk upserting clinical trials: {e}")
            raise
    

    
    # Transcript Recommendations methods
    def create_transcript_recommendations(self, transcript_id: str, eligible_trial_ids: List[str], uncertain_trial_ids: List[str]) -> str:
        """Create transcript recommendations record"""
        try:
            # First, get the clinical trial IDs from external IDs
            eligible_trial_uuids = self._get_trial_uuids_from_external_ids(eligible_trial_ids)
            uncertain_trial_uuids = self._get_trial_uuids_from_external_ids(uncertain_trial_ids)
            
            recommendations_data = {
                "transcript_id": transcript_id,
                "eligible_trials": eligible_trial_uuids,
                "uncertain_trials": uncertain_trial_uuids
            }
            
            result = self.client.table("transcript_recommendations").insert(recommendations_data).execute()
            
            if result.data:
                recommendations_id = result.data[0]["id"]
                logger.info(f"Created transcript recommendations with ID: {recommendations_id}")
                return recommendations_id
            else:
                raise Exception("Failed to create transcript recommendations - no data returned")
        except Exception as e:
            logger.error(f"Error creating transcript recommendations: {e}")
            raise
    
    def update_transcript_recommendations(self, transcript_id: str, eligible_trial_ids: List[str], uncertain_trial_ids: List[str]) -> None:
        """Update transcript recommendations record"""
        try:
            # First, get the clinical trial IDs from external IDs
            eligible_trial_uuids = self._get_trial_uuids_from_external_ids(eligible_trial_ids)
            uncertain_trial_uuids = self._get_trial_uuids_from_external_ids(uncertain_trial_ids)
            
            update_data = {
                "eligible_trials": eligible_trial_uuids,
                "uncertain_trials": uncertain_trial_uuids
            }
            
            result = self.client.table("transcript_recommendations").update(update_data).eq("transcript_id", transcript_id).execute()
            
            if not result.data:
                raise Exception(f"Transcript recommendations with transcript_id {transcript_id} not found")
                
            logger.info(f"Updated transcript recommendations for transcript: {transcript_id}")
        except Exception as e:
            logger.error(f"Error updating transcript recommendations: {e}")
            raise
    
    def get_transcript_recommendations(self, transcript_id: str) -> Optional[Dict[str, List[str]]]:
        """Get transcript recommendations record"""
        try:
            result = self.client.table("transcript_recommendations").select("*").eq("transcript_id", transcript_id).execute()
            if result.data:
                recommendations_data = result.data[0]
                # Convert UUIDs back to external IDs
                eligible_external_ids = self._get_external_ids_from_uuids(recommendations_data.get("eligible_trials", []))
                uncertain_external_ids = self._get_external_ids_from_uuids(recommendations_data.get("uncertain_trials", []))
                
                return {
                    "eligible_trial_ids": eligible_external_ids,
                    "uncertain_trial_ids": uncertain_external_ids
                }
            else:
                return None
        except Exception as e:
            logger.error(f"Error getting transcript recommendations: {e}")
            raise
    
    def _get_external_ids_from_uuids(self, uuids: List[str]) -> List[str]:
        """Get external IDs from trial UUIDs"""
        if not uuids:
            return []
        
        try:
            result = self.client.table("clinical_trials").select("external_id").in_("id", uuids).execute()
            return [trial["external_id"] for trial in result.data]
        except Exception as e:
            logger.error(f"Error getting external IDs from UUIDs: {e}")
            return []
    
    def _get_trial_uuids_from_external_ids(self, external_ids: List[str]) -> List[str]:
        """Get trial UUIDs from external IDs"""
        if not external_ids:
            return []
        
        try:
            result = self.client.table("clinical_trials").select("id").in_("external_id", external_ids).execute()
            return [trial["id"] for trial in result.data]
        except Exception as e:
            logger.error(f"Error getting trial UUIDs from external IDs: {e}")
            return []
    
    def _row_to_clinical_trial(self, row: Dict[str, Any]) -> ClinicalTrial:
        """Convert database row to ClinicalTrial domain object"""
        # Convert locations back to Location objects
        locations = []
        if row.get("locations"):
            for location_str in row["locations"]:
                # Parse "City, State" or "City, State, Country" format
                parts = location_str.split(", ")
                if len(parts) >= 2:
                    city = parts[0]
                    state = parts[1]
                    country = parts[2] if len(parts) > 2 else "United States"
                    locations.append(Location(
                        status="Unknown",
                        facility="Unknown",
                        city=city,
                        state=state,
                        country=country
                    ))
        
        return ClinicalTrial(
            external_id=row["external_id"],
            brief_title=self._clean_text(row["brief_title"]),
            official_title=self._clean_text(row.get("official_title", "")),
            status=row["status"],
            conditions=[self._clean_text(condition) for condition in row.get("conditions", [])],
            sponsor_name=self._clean_text(row.get("sponsor_name", "")),
            phases=row.get("phases", []),
            minimum_age=row.get("minimum_age"),
            maximum_age=row.get("maximum_age"),
            locations=locations,
            brief_summary=self._clean_text(str(row.get("brief_summary", ""))),
            interventions=[]  # Not stored in simplified schema
        )
    
    # Chat methods
    def _row_to_chat_session(self, row: dict) -> ChatSession:
        return ChatSession(
            id=row["id"],
            patient_id=row["patient_id"],
            clinical_trial_id=row["clinical_trial_id"],
            status=row.get("status", "active"),
            title=row.get("title"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
        )

    def _row_to_chat_message(self, row: dict) -> ChatMessage:
        return ChatMessage(
            id=row["id"],
            session_id=row["session_id"],
            sender=row["sender"],
            message=row["message"],
            metadata=row.get("metadata"),
            created_at=row.get("created_at"),
        )

    def get_chat_session(self, session_id: str) -> ChatSession:
        """
        Get chat session by ID
        """
        try:
            result = self.client.table("chat_sessions").select("*").eq("id", session_id).single().execute()
            if result.data:
                return self._row_to_chat_session(result.data)
            else:
                raise Exception(f"Chat session with ID {session_id} not found")
        except Exception as e:
            logger.error(f"Error getting chat session {session_id}: {e}")
            raise

    def get_chat_session_by_patient_and_trial(self, patient_id: str, clinical_trial_id: str) -> Optional[ChatSession]:
        """
        Get chat session by patient ID and clinical trial ID
        """
        try:
            result = self.client.table("chat_sessions").select("*").eq("patient_id", patient_id).eq("clinical_trial_id", clinical_trial_id).single().execute()
            if result.data:
                return self._row_to_chat_session(result.data)
            else:
                return None
        except Exception as e:
            logger.error(f"Error getting chat session for patient {patient_id} and trial {clinical_trial_id}: {e}")
            return None

    def create_chat_session(self, patient_id: str, clinical_trial_id: str, title: Optional[str] = None) -> ChatSession:
        """
        Create a new chat session
        """
        try:
            row = {
                "patient_id": patient_id,
                "clinical_trial_id": clinical_trial_id,
                "title": title,
                "status": "active"
            }
            result = self.client.table("chat_sessions").insert(row).execute()
            if result.data:
                return self._row_to_chat_session(result.data[0])
            else:
                raise Exception("Failed to create chat session - no data returned")
        except Exception as e:
            logger.error(f"Error creating chat session: {e}")
            raise

    def get_chat_messages(self, session_id: str, limit: int = 4) -> List[ChatMessage]:
        """
        Get the most recent chat messages for a session, ordered oldest to newest
        """
        try:
            result = (
                self.client.table("chat_messages")
                .select("*")
                .eq("session_id", session_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            messages = result.data or []
            # Return in chronological order (oldest to newest)
            return [self._row_to_chat_message(row) for row in reversed(messages)]
        except Exception as e:
            logger.error(f"Error getting chat messages for session {session_id}: {e}")
            raise

    def create_chat_message(self, session_id: str, sender: str, message: str, created_at: str, metadata: dict = {}) -> ChatMessage:
        """
        Create a new chat message record
        """
        try:
            row = {
                "session_id": session_id,
                "sender": sender,
                "message": message,
                "created_at": created_at,
                "metadata": metadata or {},
            }
            result = self.client.table("chat_messages").insert(row).execute()
            if result.data:
                return self._row_to_chat_message(result.data[0])
            else:
                raise Exception("Failed to create chat message - no data returned")
        except Exception as e:
            logger.error(f"Error creating chat message: {e}")
            raise