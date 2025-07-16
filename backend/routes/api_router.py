from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging
from dependencies import get_transcript_handler, get_clinical_trial_handler, get_chat_service
from schemas.transcript import TranscriptUploadRequest, TranscriptResponse, FakeTranscriptResponse
from schemas.clinical_trial import (
    CreateClinicalTrialRecommendationsRequest,
    CreateClinicalTrialRecommendationsResponse,
    GetClinicalTrialRequest,
    GetClinicalTrialResponse,
)
from schemas.chat import ChatMessageRequest, ChatMessageResponse
from auth import require_auth
from handlers import chat
from handlers.chat import ChatHandler

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
            "generate-fake-transcript": "/api/v1/transcripts/generate-fake/{patient_id}",
            "clinical-trials": "/api/v1/clinical-trials"
        }
    }

# Transcript endpoints
@api_router.post("/transcripts", response_model=TranscriptResponse)
async def process_transcript(
    request: TranscriptUploadRequest,
    transcript_handler = Depends(get_transcript_handler),
    _ = Depends(require_auth)  
) -> TranscriptResponse:
    """Process a transcript"""
    logger.info(f"Processing transcript for patient: {request.patient_id}")
    return transcript_handler.process_transcript(request)

@api_router.post("/transcripts/generate-fake/{patient_id}", response_model=FakeTranscriptResponse)
async def generate_fake_transcript(
    patient_id: str,
    transcript_handler = Depends(get_transcript_handler),
    _ = Depends(require_auth)  
) -> FakeTranscriptResponse:
    """Generate a fake transcript for a patient"""
    logger.info(f"Generating fake transcript for patient: {patient_id}")
    return transcript_handler.generate_fake_transcript(patient_id)

# Clinical trial endpoints
@api_router.post("/clinical-trials/recommendations", response_model=CreateClinicalTrialRecommendationsResponse)
async def create_clinical_trial_recommendations(
    request: CreateClinicalTrialRecommendationsRequest,
    clinical_trial_handler = Depends(get_clinical_trial_handler),
    _ = Depends(require_auth) 
) -> CreateClinicalTrialRecommendationsResponse:
    """Create clinical trial recommendations"""
    logger.info(f"Creating clinical trial recommendations for patient: {request.patient_id}, transcript: {request.transcript_id}")
    return await clinical_trial_handler.handle_create_clinical_trial_recommendations(request)

@api_router.get("/clinical-trials/{trial_id}", response_model=GetClinicalTrialResponse)
async def get_clinical_trial(
    trial_id: str,
    clinical_trial_handler = Depends(get_clinical_trial_handler),
    _ = Depends(require_auth) 
) -> GetClinicalTrialResponse:
    """Get a specific clinical trial by ID"""
    logger.info(f"Getting clinical trial details for ID: {trial_id}")
    request = GetClinicalTrialRequest(trial_id=trial_id)
    return await clinical_trial_handler.handle_get_clinical_trial(request)

# Note: Exception handling is done at the app level in main.py 
api_router.include_router(chat.router) 

@api_router.post("/chat/send-message", response_model=ChatMessageResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    chat_handler: ChatHandler = Depends(lambda: ChatHandler(get_chat_service())),
):
    return await chat_handler.send_message(request) 