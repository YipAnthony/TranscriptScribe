from abc import ABC, abstractmethod
from domain.parsed_transcript import ParsedTranscript

class DatabasePort(ABC):
    @abstractmethod
    def create_parsed_transcript(self, transcript: ParsedTranscript) -> None:
        """
        Create parsed transcript record in database
        
        Args:
            transcript: Parsed transcript domain model
            
        Returns:
        """
        pass
    
    @abstractmethod
    def get_parsed_transcript(self, id: str) -> ParsedTranscript:
        """
        Get parsed transcript by ID
        
        Args:
            id: Unique identifier for the parsed transcript
            
        Returns:
            ParsedTranscript: Retrieved parsed transcript object
        """
        pass 