import logging
from typing import Optional
from ports.db import DatabasePort
from ports.llm import LLMPort
from ports.transcript_analyzer import TranscriptAnalyzerPort
from domain.parsed_transcript import ParsedTranscript
from domain.exceptions import TranscriptNotFoundError

logger = logging.getLogger(__name__)

class TranscriptService:
    def __init__(self, 
                 db_adapter: DatabasePort,
                 llm_adapter: LLMPort,
                 transcript_analyzer_adapter: TranscriptAnalyzerPort):
        self.db_adapter = db_adapter
        self.llm_adapter = llm_adapter
        self.transcript_analyzer_adapter = transcript_analyzer_adapter
    
    def process_raw_transcript(self, patient_id: str, raw_transcript: str, recorded_at: Optional[str] = None) -> str:
        """
        Processes a raw transcript and stores it to the database.
        
        Args:
            patient_id: ID of the patient this transcript belongs to
            raw_transcript: Raw transcript text
            recorded_at: Optional timestamp when transcript was recorded
            
        Returns:
            str: The created transcript ID
        """
        try:
            # Analyze transcript using CrewAI first
            parsed_transcript = self.transcript_analyzer_adapter.analyze_transcript(raw_transcript)
            
            # Create transcript record in database with parsed data
            transcript_id = self.db_adapter.create_transcript(
                patient_id=patient_id,
                parsed_transcript=parsed_transcript,
                recorded_at=recorded_at
            )
            
            return transcript_id
            
        except Exception as e:
            logger.error(f"Error processing transcript for patient {patient_id}: {e}")
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
    