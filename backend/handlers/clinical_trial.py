from schemas.clinical_trial import (
    CreateClinicalTrialRecommendationsRequest, 
    CreateClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse,
    ClinicalTrialData
)
from core.services.clinical_trial_service import ClinicalTrialService
from domain.exceptions import PatientNotFoundError, TranscriptNotFoundError, TrialNotFoundError
from domain.clinical_trial import ClinicalTrial
from fastapi import HTTPException

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
            raise HTTPException(status_code=404, detail=f"Patient or transcript not found: {str(e)}")
        except Exception as e:
            # Re-raise other exceptions to be handled by the API layer
            raise HTTPException(status_code=400, detail=str(e))
    
    async def handle_get_clinical_trial(self, request: GetClinicalTrialRequest) -> GetClinicalTrialResponse:
        """
        Handle request to get a specific clinical trial
        """
        try:
            # Get specific trial using business logic
            trial = await self.trial_service.get_clinical_trial(trial_id=request.trial_id)
            
            # Convert domain model to API response data
            trial_data = ClinicalTrialData(
                external_id=trial.external_id,
                brief_title=trial.brief_title,
                official_title=trial.official_title if trial.official_title else None,
                status=trial.status,
                conditions=trial.conditions,
                sponsor_name=trial.sponsor_name if trial.sponsor_name else None,
                phases=trial.phases,
                minimum_age=trial.minimum_age,
                maximum_age=trial.maximum_age,
                locations=[f"{loc.city}, {loc.state}" for loc in trial.locations] if trial.locations else [],
                brief_summary=trial.brief_summary if trial.brief_summary else None,
                detailed_description=trial.detailed_description if trial.detailed_description else None,
                study_type=trial.study_type,
                primary_purpose=trial.primary_purpose,
                enrollment_count=trial.enrollment_count,
                start_date=trial.start_date,
                completion_date=trial.completion_date,
                primary_completion_date=trial.primary_completion_date,
                eligibility_criteria=trial.eligibility_criteria if trial.eligibility_criteria else None,
                sex=trial.sex,
                healthy_volunteers=trial.healthy_volunteers,
                standard_ages=trial.standard_ages,
                interventions=[{"name": intervention.name, "type": intervention.type} for intervention in trial.interventions],
                primary_outcomes=[{"measure": outcome.measure, "description": outcome.description, "time_frame": outcome.time_frame, "outcome_type": outcome.outcome_type} for outcome in trial.primary_outcomes],
                secondary_outcomes=[{"measure": outcome.measure, "description": outcome.description, "time_frame": outcome.time_frame, "outcome_type": outcome.outcome_type} for outcome in trial.secondary_outcomes],
                central_contacts=[{"name": contact.name, "email": contact.email, "phone": contact.phone} for contact in trial.central_contacts],
                overall_officials=[{"name": contact.name, "email": contact.email, "phone": contact.phone} for contact in trial.overall_officials],
                source_registry=trial.source_registry.value if trial.source_registry else None,
                registry_version=trial.registry_version,
                last_updated=trial.last_updated
            )
            
            # Return success with trial data
            return GetClinicalTrialResponse(
                status="success",
                message="Clinical trial retrieved successfully",
                trial=trial_data
            )
            
        except TrialNotFoundError as e:
            # Return error message for not found errors
            raise HTTPException(status_code=404, detail=f"Trial not found: {str(e)}")
        except Exception as e:
            # Re-raise other exceptions to be handled by the API layer
            raise HTTPException(status_code=400, detail=str(e)) 