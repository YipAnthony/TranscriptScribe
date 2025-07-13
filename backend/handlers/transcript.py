from ..schemas.transcript import TranscriptUploadRequest, TranscriptResponse
from ..core.services.transcript_service import TranscriptService

class TranscriptHandler:
    def __init__(self, transcript_service: TranscriptService):
        self.transcript_service = transcript_service
    
    def process_transcript(self, request: TranscriptUploadRequest) -> TranscriptResponse:
        """
        Process transcript request - invokes transcript service
        """
        try:
            self.transcript_service.process_raw_transcript(
                patient_id=request.patient_id,
                raw_transcript=request.raw_transcript,
                recorded_at=request.recorded_at
            )
            return TranscriptResponse(status="success", error=None)
        except Exception as e:
            return TranscriptResponse(status="error", error=str(e)) 