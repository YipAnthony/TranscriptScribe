from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging
from dependencies import get_transcript_handler, get_clinical_trial_handler
from schemas.transcript import TranscriptUploadRequest, TranscriptResponse
from schemas.clinical_trial import (
    CreateClinicalTrialRecommendationsRequest,
    CreateClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse,
)
from logging_config import get_logger

logger = get_logger(__name__)

# Create API router
api_router = APIRouter(prefix="/api/v1", tags=["api"])

# Health check endpoint
@api_router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for API routes"""
    logger.info("🏥 API health check requested")
    return {
        "status": "healthy",
        "service": "TranscriptScribe API",
        "version": "1.0.0",
        "endpoints": {
            "transcripts": "/api/v1/transcripts",
            "clinical-trials": "/api/v1/clinical-trials"
        }
    }

# Transcript endpoints
@api_router.post("/transcripts", response_model=TranscriptResponse)
async def process_transcript(
    request: TranscriptUploadRequest,
    transcript_handler = Depends(get_transcript_handler)
) -> TranscriptResponse:
    """Process a transcript"""
    logger.info(f"📝 API: Processing transcript for patient: {request.patient_id}")
    logger.debug(f"📋 API: Request details - recorded_at: {request.recorded_at}, transcript_length: {len(request.raw_transcript)}")
    
    try:
        response = transcript_handler.process_transcript(request)
        if response.status == "success":
            logger.info(f"✅ API: Transcript processed successfully for patient {request.patient_id}, transcript_id: {response.transcript_id}")
        else:
            logger.error(f"❌ API: Transcript processing failed for patient {request.patient_id}: {response.error}")
        return response
    except Exception as e:
        logger.error(f"💥 API: Unexpected error processing transcript for patient {request.patient_id}: {e}", exc_info=True)
        raise

# Clinical trial endpoints
@api_router.post("/clinical-trials/recommendations", response_model=CreateClinicalTrialRecommendationsResponse)
async def create_clinical_trial_recommendations(
    request: CreateClinicalTrialRecommendationsRequest,
    clinical_trial_handler = Depends(get_clinical_trial_handler)
) -> CreateClinicalTrialRecommendationsResponse:
    """Create clinical trial recommendations"""
    logger.info(f"🔬 API: Creating clinical trial recommendations for patient: {request.patient_id}, transcript: {request.transcript_id}")
    
    try:
        response = await clinical_trial_handler.handle_create_clinical_trial_recommendations(request)
        if response.status == "success":
            logger.info(f"✅ API: Clinical trial recommendations created successfully for patient {request.patient_id}")
        else:
            logger.warning(f"⚠️ API: Clinical trial recommendations creation failed for patient {request.patient_id}: {response.message}")
        return response
    except Exception as e:
        logger.error(f"💥 API: Unexpected error creating clinical trial recommendations for patient {request.patient_id}: {e}", exc_info=True)
        raise

@api_router.get("/clinical-trials/{trial_id}", response_model=GetClinicalTrialResponse)
async def get_clinical_trial(
    trial_id: str,
    clinical_trial_handler = Depends(get_clinical_trial_handler)
) -> GetClinicalTrialResponse:
    """Get a specific clinical trial by ID"""
    logger.info(f"🔬 API: Getting clinical trial details for ID: {trial_id}")
    
    try:
        request = GetClinicalTrialRequest(trial_id=trial_id)
        response = await clinical_trial_handler.handle_get_clinical_trial(request)
        if response.status == "success":
            logger.info(f"✅ API: Clinical trial retrieved successfully: {trial_id}")
        else:
            logger.warning(f"⚠️ API: Clinical trial retrieval failed for {trial_id}: {response.message}")
        return response
    except Exception as e:
        logger.error(f"💥 API: Unexpected error getting clinical trial {trial_id}: {e}", exc_info=True)
        raise

# Note: Exception handling is done at the app level in main.py 