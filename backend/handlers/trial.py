from ..schemas.clinical_trial import ClinicalTrialSearchRequest, ClinicalTrialSearchResponse
from ..core.services.clinical_trial_service import ClinicalTrialService

class ClinicalTrialHandler:
    def __init__(self, trial_service: ClinicalTrialService):
        self.trial_service = trial_service
    
    def handle_clinical_trial_search(self, request: ClinicalTrialSearchRequest) -> ClinicalTrialSearchResponse:
        """
        Handle clinical trial search request
        """
        try:
            # Find recommended trials using business logic
            trials = self.trial_service.find_recommended_trials(
                patient_id=request.patient_id,
                transcript_id=request.transcript_id
            )
            
            # Transform to API response
            return ClinicalTrialSearchResponse(
                trials=trials,
                total_count=len(trials),
                search_criteria=request.search_criteria or {}
            )
            
        except Exception as e:
            # Return empty response with error
            return ClinicalTrialSearchResponse(
                trials=[],
                total_count=0,
                search_criteria=request.search_criteria or {}
            ) 