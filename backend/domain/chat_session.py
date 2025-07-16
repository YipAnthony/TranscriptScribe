from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class ChatSession:
    id: str
    patient_id: str
    clinical_trial_id: str
    status: Optional[str] = 'active'
    title: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None 