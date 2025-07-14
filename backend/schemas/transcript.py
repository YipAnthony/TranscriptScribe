from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TranscriptUploadRequest(BaseModel):
    """API request for uploading a transcript"""
    patient_id: str
    raw_transcript: str
    recorded_at: Optional[datetime] = None

class TranscriptResponse(BaseModel):
    """Generic API response for transcript operations"""
    status: str
    error: Optional[str] = None
    transcript_id: Optional[str] = None

class TranscriptAnalysisRequest(BaseModel):
    """API request for analyzing a transcript (async)"""
    transcript_id: str 