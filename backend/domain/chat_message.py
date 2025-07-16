from dataclasses import dataclass
from typing import Optional, Any
from datetime import datetime

@dataclass
class ChatMessage:
    id: str
    session_id: str
    sender: str  # 'user' or 'bot'
    message: str
    metadata: Optional[Any] = None
    created_at: Optional[datetime] = None 