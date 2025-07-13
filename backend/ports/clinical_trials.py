from abc import ABC, abstractmethod
from domain.patient import Patient
from domain.clinical_trial import ClinicalTrial
from domain.parsed_transcript import ParsedTranscript

class ClinicalTrialsPort(ABC):
    @abstractmethod
    def find_recommended_clinical_trials(self, patient: Patient, parsed_transcript: ParsedTranscript) -> list[ClinicalTrial]:
        """
        Find recommended clinical trials based on patient profile & parsed transcript
        
        Args:
            patient: Patient domain model
            parsed_transcript: Parsed transcript domain model
            
        Returns:
            List[ClinicalTrial]: List of recommended clinical trials
        """
        pass
    
    @abstractmethod
    def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Get a specific clinical trial by its ID
        
        Args:
            trial_id: The external ID of the clinical trial
            
        Returns:
            ClinicalTrial: The clinical trial details
            
        Raises:
            TrialNotFoundError: If trial is not found
        """
        pass 