"""
Dependency injection module for FastAPI
"""
from typing import Optional
from handlers.transcript import TranscriptHandler
from handlers.clinical_trial import ClinicalTrialHandler
from core.services.chat_service import ChatService

# Global handler dependencies
_transcript_handler: Optional[TranscriptHandler] = None
_clinical_trial_handler: Optional[ClinicalTrialHandler] = None
_chat_service: Optional[ChatService] = None

def set_dependencies(
    transcript_handler: TranscriptHandler,
    clinical_trial_handler: ClinicalTrialHandler,
    chat_service: Optional[ChatService] = None
):
    """Set the global handler dependency instances"""
    global _transcript_handler, _clinical_trial_handler, _chat_service
    _transcript_handler = transcript_handler
    _clinical_trial_handler = clinical_trial_handler
    if chat_service is not None:
        _chat_service = chat_service

def get_transcript_handler() -> TranscriptHandler:
    if _transcript_handler is None:
        raise RuntimeError("Transcript handler not initialized")
    return _transcript_handler

def get_clinical_trial_handler() -> ClinicalTrialHandler:
    if _clinical_trial_handler is None:
        raise RuntimeError("Clinical trial handler not initialized")
    return _clinical_trial_handler

def get_chat_service() -> ChatService:
    if _chat_service is None:
        raise RuntimeError("Chat service not initialized")
    return _chat_service 