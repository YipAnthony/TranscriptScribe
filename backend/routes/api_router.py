from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging
from dependencies import get_transcript_handler, get_clinical_trial_handler
from schemas.transcript import TranscriptUploadRequest, TranscriptResponse
from schemas.clinical_trial import (
    GetClinicalTrialRecommendationsRequest,
    GetClinicalTrialRecommendationsResponse,
    GetClinicalTrialResponse,
)

logger = logging.getLogger(__name__)

# Create API router
api_router = APIRouter(prefix="/api/v1", tags=["api"])

# Health check endpoint
@api_router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for API routes"""
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
    logger.info(f"Processing transcript for patient: {request.patient_id}")
    return transcript_handler.process_transcript(request)

# Clinical trial endpoints
@api_router.post("/clinical-trials/recommendations", response_model=GetClinicalTrialRecommendationsResponse)
async def get_clinical_trial_recommendations(
    request: GetClinicalTrialRecommendationsRequest,
    clinical_trial_handler = Depends(get_clinical_trial_handler)
) -> GetClinicalTrialRecommendationsResponse:
    """Get clinical trial recommendations"""
    # TODO: Implement clinical trial recommendations with actual handler
    logger.info("Clinical trial recommendations endpoint called")
    raise HTTPException(
        status_code=501, 
        detail="Clinical trial recommendations not yet implemented"
    )

@api_router.get("/clinical-trials/{trial_id}", response_model=GetClinicalTrialResponse)
async def get_clinical_trial(
    trial_id: str,
    clinical_trial_handler = Depends(get_clinical_trial_handler)
) -> GetClinicalTrialResponse:
    """Get a specific clinical trial by ID"""
    # TODO: Implement clinical trial retrieval with actual handler
    logger.info(f"Clinical trial retrieval endpoint called for ID: {trial_id}")
    raise HTTPException(
        status_code=501, 
        detail="Clinical trial retrieval not yet implemented"
    )

# Note: Exception handling is done at the app level in main.py 