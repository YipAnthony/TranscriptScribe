from schemas.clinical_trial import (
    GetClinicalTrialRecommendationsRequest, 
    GetClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse,
    ClinicalTrialPreviewResponse,
    ClinicalTrialDetailedResponse
)
from core.services.clinical_trial_service import ClinicalTrialService
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError, TrialNotFoundError

class ClinicalTrialHandler:
    def __init__(self, trial_service: ClinicalTrialService):
        self.trial_service = trial_service
    
    def handle_get_clinical_trial_recommendations(self, request: GetClinicalTrialRecommendationsRequest) -> GetClinicalTrialRecommendationsResponse:
        """
        Handle request to get clinical trial recommendations
        """
        try:
            # Find recommended trials using business logic
            trials = self.trial_service.find_recommended_trials(
                patient_id=request.patient_id,
                transcript_id=request.transcript_id
            )
            
            # Convert domain models to preview responses
            preview_responses = []
            for trial in trials:
                preview_data = trial.get_preview_data()
                preview_response = ClinicalTrialPreviewResponse(**preview_data)
                preview_responses.append(preview_response)
            
            # Transform to API response
            return GetClinicalTrialRecommendationsResponse(
                trials=preview_responses,
                total_count=len(preview_responses),
                search_criteria=request.search_criteria or {}
            )
            
        except (PatientNotFoundError, TranscriptNotFoundError) as e:
            # Return empty response for not found errors
            return GetClinicalTrialRecommendationsResponse(
                trials=[],
                total_count=0,
                search_criteria=request.search_criteria or {}
            )
        except Exception as e:
            # Re-raise other exceptions to be handled by the API layer
            raise e
    
    def handle_get_clinical_trial(self, request: GetClinicalTrialRequest) -> GetClinicalTrialResponse:
        """
        Handle request to get a specific clinical trial
        """
        try:
            # Get specific trial using business logic
            trial = self.trial_service.get_clinical_trial(trial_id=request.trial_id)
            
            # Convert domain model to detailed response
            detailed_data = trial.get_detailed_data()
            detailed_response = ClinicalTrialDetailedResponse(**detailed_data)
            
            # Transform to API response
            return GetClinicalTrialResponse(trial=detailed_response)
            
        except TrialNotFoundError as e:
            # Re-raise not found errors to be handled by the API layer
            raise e
        except Exception as e:
            # Re-raise other exceptions to be handled by the API layer
            raise e 