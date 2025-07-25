from schemas.transcript import TranscriptUploadRequest, TranscriptResponse, FakeTranscriptResponse
from core.services.transcript_service import TranscriptService
from fastapi import HTTPException

class TranscriptHandler:
    def __init__(self, transcript_service: TranscriptService):
        self.transcript_service = transcript_service
    
    def process_transcript(self, request: TranscriptUploadRequest) -> TranscriptResponse:
        """
        Process transcript request - invokes transcript service
        """
        try:
            transcript_id = self.transcript_service.process_raw_transcript(
                patient_id=request.patient_id,
                raw_transcript=request.raw_transcript,
                recorded_at=request.recorded_at.isoformat() if request.recorded_at else None
            )
            return TranscriptResponse(status="success", error=None, transcript_id=transcript_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    def generate_fake_transcript(self, patient_id: str) -> FakeTranscriptResponse:
        """
        Generate fake transcript for a patient - invokes transcript service
        """
        try:
            fake_transcript = self.transcript_service.generate_fake_transcript(patient_id=patient_id)
            return FakeTranscriptResponse(status="success", error=None, fake_transcript=fake_transcript)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e)) 