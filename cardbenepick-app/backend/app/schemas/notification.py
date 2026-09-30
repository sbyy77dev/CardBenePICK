from sqlmodel import SQLModel
from typing import Any, Optional
from datetime import datetime

class NotificationResponse(SQLModel):
    id: int
    alarm_type: int  # 1: 카드, 2: 공지
    content: Any     # JSON 데이터가 딕셔너리로 변환되어 들어감
    is_read: bool
    created_at: datetime
    link_url: Optional[str] = None