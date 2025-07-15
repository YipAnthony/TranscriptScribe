from abc import ABC, abstractmethod
from typing import Optional, List, Dict
from domain.parsed_transcript import ParsedTranscript
from domain.patient import Patient
from domain.clinical_trial import ClinicalTrial
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError

class DatabasePort(ABC):
    # Patient methods
    @abstractmethod
    def get_patient(self, patient_id: str) -> Patient:
        """
        Get patient by ID
        
        Args:
            patient_id: Unique identifier for the patient
            
        Returns:
            Patient: Retrieved patient object
            
        Raises:
            PatientNotFoundError: If patient is not found
        """
        pass
    
    # Transcript methods
    @abstractmethod
    def create_transcript(self, patient_id: str, parsed_transcript: ParsedTranscript, recorded_at: Optional[str] = None) -> str:
        """
        Create a new transcript record
        
        Args:
            patient_id: ID of the patient this transcript belongs to
            parsed_transcript: Parsed transcript domain model
            recorded_at: Optional timestamp when transcript was recorded
            
        Returns:
            str: The created transcript's ID
        """
        pass
    
    @abstractmethod
    def get_transcript(self, transcript_id: str) -> ParsedTranscript:
        """
        Get transcript by ID
        
        Args:
            transcript_id: Unique identifier for the transcript
            
        Returns:
            ParsedTranscript: Retrieved parsed transcript object
            
        Raises:
            TranscriptNotFoundError: If transcript is not found
        """
        pass
    
    @abstractmethod
    def update_transcript_status(self, transcript_id: str, status: str) -> None:
        """
        Update transcript status
        
        Args:
            transcript_id: Unique identifier for the transcript
            status: New status ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')
        """
        pass
    
    @abstractmethod
    def update_parsed_transcript(self, transcript_id: str, parsed_transcript: ParsedTranscript) -> None:
        """
        Update transcript with parsed data
        
        Args:
            transcript_id: Unique identifier for the transcript
            parsed_transcript: Parsed transcript domain model
        """
        pass
    
    @abstractmethod
    def delete_transcript(self, transcript_id: str) -> None:
        """
        Delete a transcript record
        
        Args:
            transcript_id: Unique identifier for the transcript to delete
        """
        pass
    
    # Clinical Trial methods
    @abstractmethod
    def upsert_clinical_trial(self, clinical_trial: ClinicalTrial) -> str:
        """
        Insert or update a clinical trial record
        
        Args:
            clinical_trial: Clinical trial domain model
            
        Returns:
            str: The clinical trial's ID
        """
        pass
    
    @abstractmethod
    def get_clinical_trial(self, external_id: str) -> Optional[ClinicalTrial]:
        """
        Get clinical trial by external ID (e.g., NCT ID)
        
        Args:
            external_id: External identifier for the clinical trial
            
        Returns:
            ClinicalTrial: Retrieved clinical trial object or None if not found
        """
        pass
    
    @abstractmethod
    def upsert_clinical_trials(self, clinical_trials: List[ClinicalTrial]) -> int:
        """
        Bulk insert or update clinical trials
        
        Args:
            clinical_trials: List of ClinicalTrial objects to upsert
            
        Returns:
            int: Number of trials successfully upserted
        """
        pass
    
    # Transcript Recommendations methods
    @abstractmethod
    def create_transcript_recommendations(self, transcript_id: str, eligible_trial_ids: List[str], uncertain_trial_ids: List[str]) -> str:
        """
        Create transcript recommendations record
        
        Args:
            transcript_id: ID of the transcript
            eligible_trial_ids: List of eligible trial external IDs
            uncertain_trial_ids: List of uncertain trial external IDs
            
        Returns:
            str: The created transcript recommendations ID
        """
        pass
    
    @abstractmethod
    def update_transcript_recommendations(self, transcript_id: str, eligible_trial_ids: List[str], uncertain_trial_ids: List[str]) -> None:
        """
        Update transcript recommendations record
        
        Args:
            transcript_id: ID of the transcript
            eligible_trial_ids: List of eligible trial external IDs
            uncertain_trial_ids: List of uncertain trial external IDs
        """
        pass
    
    @abstractmethod
    def get_transcript_recommendations(self, transcript_id: str) -> Optional[Dict[str, List[str]]]:
        """
        Get transcript recommendations record
        
        Args:
            transcript_id: ID of the transcript
            
        Returns:
            Optional[Dict[str, List[str]]]: Dictionary with 'eligible_trial_ids' and 'uncertain_trial_ids' lists, or None if not found
        """
        pass 