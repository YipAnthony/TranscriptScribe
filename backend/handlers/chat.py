from fastapi import APIRouter, Depends, HTTPException
from core.services.chat_service import ChatService
from schemas.chat import ChatMessageRequest, ChatMessageResponse
from dependencies import get_chat_service

router = APIRouter()

class ChatHandler:
    def __init__(self, chat_service):
        self.chat_service = chat_service

    async def send_message(self, request):
        try:
            await self.chat_service.ask_clinical_trial_question(
                patient_id=request.patient_id,
                session_id=request.session_id,
                clinical_trial_id=request.clinical_trial_id,
                user_message=request.user_message,
            )
            return ChatMessageResponse(status="success")
        except Exception as e:
            raise e 