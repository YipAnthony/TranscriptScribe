from abc import ABC, abstractmethod
from domain.patient import Patient
from domain.clinical_trial import ClinicalTrial
from domain.parsed_transcript import ParsedTranscript

class ClinicalTrialsPort(ABC):
    @abstractmethod
    async def find_recommended_clinical_trials(self, patient: Patient, parsed_transcript: ParsedTranscript) -> list[ClinicalTrial]:
        """
        Find recommended clinical trials based on patient profile & parsed transcript
        """
        pass

    @abstractmethod
    async def get_clinical_trial(self, trial_id: str) -> ClinicalTrial:
        """
        Get a specific clinical trial by its ID
        """
        pass
    
 