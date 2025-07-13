"""
Dependency injection module for FastAPI
"""
from typing import Optional
from handlers.transcript import TranscriptHandler
from handlers.clinical_trial import ClinicalTrialHandler

# Global handler dependencies
_transcript_handler: Optional[TranscriptHandler] = None
_clinical_trial_handler: Optional[ClinicalTrialHandler] = None

def set_dependencies(
    transcript_handler: TranscriptHandler,
    clinical_trial_handler: ClinicalTrialHandler
):
    """Set the global handler dependency instances"""
    global _transcript_handler, _clinical_trial_handler
    _transcript_handler = transcript_handler
    _clinical_trial_handler = clinical_trial_handler

def get_transcript_handler() -> TranscriptHandler:
    if _transcript_handler is None:
        raise RuntimeError("Transcript handler not initialized")
    return _transcript_handler

def get_clinical_trial_handler() -> ClinicalTrialHandler:
    if _clinical_trial_handler is None:
        raise RuntimeError("Clinical trial handler not initialized")
    return _clinical_trial_handler 