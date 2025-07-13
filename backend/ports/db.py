from abc import ABC, abstractmethod
from typing import Optional
from domain.parsed_transcript import ParsedTranscript
from domain.patient import Patient
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