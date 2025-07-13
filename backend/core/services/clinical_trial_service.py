from domain.patient import Patient
from domain.parsed_transcript import ParsedTranscript
from domain.clinical_trial import ClinicalTrial
from ports.db import DatabasePort
from ports.clinical_trials import ClinicalTrialsPort
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError

class ClinicalTrialService:
    def __init__(self, db_adapter: DatabasePort, clinical_trials_adapter: ClinicalTrialsPort):
        self.db_adapter = db_adapter
        self.clinical_trials_adapter = clinical_trials_adapter
    
    def find_recommended_trials(self, patient_id: str, transcript_id: str) -> list[ClinicalTrial]:
        """
        Calls the clinical trials port to find recommended clinical trials based on patient profile and appointment transcript.
        Returns the list of recommended trials.
        
        Args:
            patient_id: ID of the patient
            transcript_id: ID of the transcript
            
        Returns:
            list[ClinicalTrial]: List of recommended clinical trials
            
        Raises:
            PatientNotFoundError: If patient is not found
            TranscriptNotFoundError: If transcript is not found
        """
        # Get patient and transcript data
        patient = self.db_adapter.get_patient(patient_id)
        parsed_transcript = self.db_adapter.get_transcript(transcript_id)
        
        # Find recommended trials using the clinical trials adapter
        return self.clinical_trials_adapter.find_recommended_clinical_trials(patient, parsed_transcript)
    
    def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Retrieves a specific clinical trial by ID from the clinical trials adapter.
        
        Args:
            trial_id: ID of the clinical trial
            
        Returns:
            ClinicalTrial: The clinical trial details
            
        Raises:
            TrialNotFoundError: If trial is not found
        """
        return self.clinical_trials_adapter.get_clinical_trial(trial_id)