from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial

class ClinicalTrialService:
    def __init__(self):
        pass
    
    def find_recommended_trials(self, patient_id: str, transcript_id: str) -> list[ClinicalTrial]:
        """
        Calls the clinical trials port to find recommended clinical trials based on patient profile and appointment transcript.
        Returns the list of recommended trials.
        """
        raise NotImplementedError("find_recommended_trials method not yet implemented")
    
    def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Retrieves a specific clinical trial by ID from the database.
        """
        raise NotImplementedError("get_clinical_trial method not yet implemented")