from ports.db import DatabasePort
from domain.parsed_transcript import ParsedTranscript

class SupabaseAdapter(DatabasePort):
    def __init__(self):
        pass
    
    # TODO: implement this
    def create_parsed_transcript(self, transcript: ParsedTranscript) -> None:
        """
        Create parsed transcript record in Supabase
        """
        pass
    
    # TODO: implement this
    def get_parsed_transcript(self, id: str) -> ParsedTranscript:
        """
        Get parsed transcript by ID from Supabase
        """
        return ParsedTranscript()