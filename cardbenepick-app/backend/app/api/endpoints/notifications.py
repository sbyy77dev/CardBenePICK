from typing import List, Union, Dict, Any
import json
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.api import deps
from app.core.security import get_current_user_payload
from app.db.models import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter()

@router.get("/", response_model=List[NotificationResponse])
def get_my_notifications(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    
    # 최신순 정렬 (카드실적은 매일 생성되므로 자연스럽게 상단에 위치하다가 밀려남)
    notis = db.exec(
        select(Notification)
        .where(Notification.user_id == user_id)
        .where(Notification.is_active == True)
        .order_by(Notification.created_at.desc())
    ).all()

    results = []
    for noti in notis:
        try:
            parsed_content = noti.content
            # JSON 문자열이면 파싱
            if isinstance(parsed_content, str):
                parsed_content = json.loads(parsed_content)
                
            # [중요] 리스트를 풀지 않고 그대로 보냅니다!
            # 프론트엔드에서 "이게 리스트면 접기/펴기 UI를 보여줘야지" 하고 판단합니다.
            
        except Exception as e:
            print(f"Parsing Error: {e}")
            parsed_content = {}

        # 👇 [수정됨] 상세 제목(detail_title)을 추가했습니다!
        if noti.alarm_type == 2:
            parsed_content = {
                "title": "공지사항",  # [목록용] 알림 리스트에는 '공지사항'이라고 뜸
                "message": "서비스 이용 약관 개정이 변경되었습니다.", # [목록용] 리스트 내용
                "detail_title": "서비스 이용 약관 개정 안내", # [상세용] 클릭 시 뜨는 진짜 제목
                "content": """안녕하세요. CardBenePICK 서비스 팀입니다.

더 나은 서비스 제공을 위해 서비스 이용 약관이 2026년 1월 1일자로 개정될 예정입니다.
변경된 약관 내용을 확인하시어 서비스 이용에 불편이 없으시길 바랍니다.

[주요 개정 내용]
1. 개인정보 처리 방침 구체화
   - 수집하는 개인정보 항목 및 이용 목적 명확화
2. 서비스 이용 제한 사유 추가
   - 부정 사용 방지를 위한 조항 신설
3. 위치 기반 서비스 이용 약관 변경
   - 위치 정보 활용 동의 절차 간소화

[시행 일자]
2025년 12월 1일 (월)

앞으로도 더욱 신뢰받는 서비스가 되도록 노력하겠습니다.
감사합니다."""
            }

        results.append(NotificationResponse(
            id=noti.id,
            alarm_type=noti.alarm_type,
            content=parsed_content, # 리스트([]) 또는 딕셔너리({})가 그대로 들어감
            is_read=noti.read_at is not None,
            created_at=noti.created_at,
            link_url=noti.link_url
        ))
    
    return results

    