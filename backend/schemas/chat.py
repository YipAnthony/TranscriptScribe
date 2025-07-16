from pydantic import BaseModel

class ChatMessageRequest(BaseModel):
    patient_id: str
    session_id: str
    clinical_trial_id: str
    user_message: str

class ChatMessageResponse(BaseModel):
    status: str 