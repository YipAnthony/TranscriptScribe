from abc import ABC, abstractmethod
from typing import Union
from ..domain.parsed_transcript import ParsedTranscript

class TranscriptAnalyzerPort(ABC):
    @abstractmethod
    def analyze_transcript(self, raw_transcript: Union[str, dict]) -> ParsedTranscript:
        """
        Analyze raw transcript data and return structured ParsedTranscript object
        
        Args:
            raw_transcript: Raw transcript as string or JSON dict
            
        Returns:
            ParsedTranscript: Structured domain model with extracted information
        """
        pass 