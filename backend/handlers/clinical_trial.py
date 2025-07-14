from schemas.clinical_trial import (
    CreateClinicalTrialRecommendationsRequest, 
    CreateClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse
)
from core.services.clinical_trial_service import ClinicalTrialService
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError, TrialNotFoundError

class ClinicalTrialHandler:
    def __init__(self, trial_service: ClinicalTrialService):
        self.trial_service = trial_service
    
    async def handle_create_clinical_trial_recommendations(self, request: CreateClinicalTrialRecommendationsRequest) -> CreateClinicalTrialRecommendationsResponse:
        """
        Handle request to create clinical trial recommendations
        """
        try:
            # Create recommended trials using business logic (stores in DB)
            await self.trial_service.create_recommended_trials(
                patient_id=request.patient_id,
                transcript_id=request.transcript_id
            )
            
            # Return success message
            return CreateClinicalTrialRecommendationsResponse(
                status="success",
                message="Clinical trial recommendations created successfully"
            )
            
        except (PatientNotFoundError, TranscriptNotFoundError) as e:
            # Return error message for not found errors
            return CreateClinicalTrialRecommendationsResponse(
                status="error",
                message=f"Patient or transcript not found: {str(e)}"
            )
        except Exception as e:
            # Re-raise other exceptions to be handled by the API layer
            raise e
    
    async def handle_get_clinical_trial(self, request: GetClinicalTrialRequest) -> GetClinicalTrialResponse:
        """
        Handle request to get a specific clinical trial
        """
        try:
            # Get specific trial using business logic (stores in DB)
            await self.trial_service.get_clinical_trial(trial_id=request.trial_id)
            
            # Return success message
            return GetClinicalTrialResponse(
                status="success",
                message="Clinical trial retrieved successfully"
            )
            
        except TrialNotFoundError as e:
            # Return error message for not found errors
            return GetClinicalTrialResponse(
                status="error",
                message=f"Trial not found: {str(e)}"
            )
        except Exception as e:
            # Re-raise other exceptions to be handled by the API layer
            raise e 