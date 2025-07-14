from schemas.clinical_trial import (
    CreateClinicalTrialRecommendationsRequest, 
    CreateClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse
)
from core.services.clinical_trial_service import ClinicalTrialService
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError, TrialNotFoundError
from logging_config import get_logger

logger = get_logger(__name__)

class ClinicalTrialHandler:
    def __init__(self, trial_service: ClinicalTrialService):
        self.trial_service = trial_service
        logger.info("🔬 ClinicalTrialHandler initialized")
    
    async def handle_create_clinical_trial_recommendations(self, request: CreateClinicalTrialRecommendationsRequest) -> CreateClinicalTrialRecommendationsResponse:
        """
        Handle request to create clinical trial recommendations
        """
        logger.info(f"🔄 Creating clinical trial recommendations for patient {request.patient_id}, transcript {request.transcript_id}")
        
        try:
            logger.info("🎯 Calling clinical trial service to create recommendations...")
            # Create recommended trials using business logic (stores in DB)
            await self.trial_service.create_recommended_trials(
                patient_id=request.patient_id,
                transcript_id=request.transcript_id
            )
            
            logger.info(f"✅ Clinical trial recommendations created successfully for patient {request.patient_id}")
            # Return success message
            return CreateClinicalTrialRecommendationsResponse(
                status="success",
                message="Clinical trial recommendations created successfully"
            )
            
        except (PatientNotFoundError, TranscriptNotFoundError) as e:
            logger.warning(f"⚠️ Patient or transcript not found: {e}")
            # Return error message for not found errors
            return CreateClinicalTrialRecommendationsResponse(
                status="error",
                message=f"Patient or transcript not found: {str(e)}"
            )
        except Exception as e:
            logger.error(f"❌ Error creating clinical trial recommendations for patient {request.patient_id}: {e}", exc_info=True)
            # Re-raise other exceptions to be handled by the API layer
            raise e
    
    async def handle_get_clinical_trial(self, request: GetClinicalTrialRequest) -> GetClinicalTrialResponse:
        """
        Handle request to get a specific clinical trial
        """
        logger.info(f"🔄 Getting clinical trial details for ID: {request.trial_id}")
        
        try:
            logger.info("🎯 Calling clinical trial service to get trial...")
            # Get specific trial using business logic (stores in DB)
            await self.trial_service.get_clinical_trial(trial_id=request.trial_id)
            
            logger.info(f"✅ Clinical trial retrieved successfully: {request.trial_id}")
            # Return success message
            return GetClinicalTrialResponse(
                status="success",
                message="Clinical trial retrieved successfully"
            )
            
        except TrialNotFoundError as e:
            logger.warning(f"⚠️ Trial not found: {e}")
            # Return error message for not found errors
            return GetClinicalTrialResponse(
                status="error",
                message=f"Trial not found: {str(e)}"
            )
        except Exception as e:
            logger.error(f"❌ Error getting clinical trial {request.trial_id}: {e}", exc_info=True)
            # Re-raise other exceptions to be handled by the API layer
            raise e 