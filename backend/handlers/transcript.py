from schemas.transcript import TranscriptUploadRequest, TranscriptResponse
from core.services.transcript_service import TranscriptService
from logging_config import get_logger

logger = get_logger(__name__)

class TranscriptHandler:
    def __init__(self, transcript_service: TranscriptService):
        self.transcript_service = transcript_service
        logger.info("📝 TranscriptHandler initialized")
    
    def process_transcript(self, request: TranscriptUploadRequest) -> TranscriptResponse:
        """
        Process transcript request - invokes transcript service
        """
        logger.info(f"🔄 Processing transcript request for patient {request.patient_id}")
        logger.debug(f"📋 Request details: recorded_at={request.recorded_at}, transcript_length={len(request.raw_transcript)}")
        
        try:
            logger.info("🎯 Calling transcript service to process raw transcript...")
            transcript_id = self.transcript_service.process_raw_transcript(
                patient_id=request.patient_id,
                raw_transcript=request.raw_transcript,
                recorded_at=request.recorded_at.isoformat() if request.recorded_at else None
            )
            
            logger.info(f"✅ Transcript processed successfully with ID: {transcript_id}")
            return TranscriptResponse(status="success", error=None, transcript_id=transcript_id)
            
        except Exception as e:
            logger.error(f"❌ Error processing transcript for patient {request.patient_id}: {e}", exc_info=True)
            return TranscriptResponse(status="error", error=str(e), transcript_id=None) 