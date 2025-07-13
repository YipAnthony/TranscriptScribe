from typing import Union
from ports.transcript_analyzer import TranscriptAnalyzerPort
from domain.parsed_transcript import ParsedTranscript

class CrewAITranscriptAnalyzer(TranscriptAnalyzerPort):
    def __init__(self):
        pass
    
    # TODO: implement this
    def analyze_transcript(self, raw_transcript: Union[str, dict]) -> ParsedTranscript:
        """
        Analyze transcript using CrewAI agents
        
        Args:
            raw_transcript: Raw transcript as string or JSON dict
            
        Returns:
            ParsedTranscript: Structured domain model with extracted information
        """
        return ParsedTranscript()