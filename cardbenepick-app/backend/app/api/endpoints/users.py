# backend/app/api/endpoints/users.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordBearer # 추가
from jose import jwt, JWTError # 추가
from app.api import deps
from app.core.security import get_current_user_payload
from app.db.models import UserMaster, UserAsset, CardTransaction
from app.schemas.response import UserResponse
from app.core.config import settings # 토큰 디코딩을 위해 설정 로드
from typing import Any, List, Optional
from pydantic import BaseModel
import httpx # httpx 추가 (pip install httpx 필요)

router = APIRouter()

# -----------------------------------------------------------
# [설정] 선택적 인증 (로그인 안 해도 접근 가능하게 함)
# auto_error=False로 설정하면 토큰이 없어도 401 에러가 나지 않고 None이 반환됩니다.
# -----------------------------------------------------------
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False 
)

def get_current_user_optional(token: Optional[str] = Depends(reusable_oauth2)) -> Optional[dict]:
    """
    토큰이 있으면 디코딩해서 유저 정보를 반환하고,
    토큰이 없거나 유효하지 않으면 None을 반환합니다 (에러 발생 X).
    """
    if not token:
        return None
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None

# -----------------------------------------------------------
# 데이터 모델
# -----------------------------------------------------------
class UserPreferenceCreate(BaseModel):
    user_id: Optional[str] = None
    cluster_id: int
    preferred_categories: List[str]
    timestamp: str


@router.get("/me", response_model=UserResponse)
def read_user_me(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    내 정보 조회
    """
    user_id = payload.get("user_id")
    user = db.get(UserMaster, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete("/me")
def delete_user_me(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    회원 탈퇴: 유저 정보뿐만 아니라 연동된 자산, 거래 내역을 모두 삭제합니다.
    """
    user_id = payload.get("user_id")
    user = db.get(UserMaster, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        # [수정된 부분] 안전한 삭제 방식 (객체 조회 -> db.delete)
        # 데이터가 없으면 빈 리스트([])가 반환되어 for문이 실행되지 않으므로 에러가 나지 않습니다.
        
        # 1. 거래 내역 삭제
        transactions = db.exec(select(CardTransaction).where(CardTransaction.user_id == user_id)).all()
        for transaction in transactions:
            db.delete(transaction)
            
        # 2. 자산(연동 정보) 삭제
        assets = db.exec(select(UserAsset).where(UserAsset.user_id == user_id)).all()
        for asset in assets:
            db.delete(asset)
            
        # 3. 유저 마스터 삭제
        db.delete(user)
        
        db.commit()
        return {"message": "회원 탈퇴가 완료되었습니다."}
        
    except Exception as e:
        db.rollback()
        print(f"Withdrawal Error: {e}")
        raise HTTPException(status_code=500, detail=f"탈퇴 처리 중 오류 발생: {str(e)}")
    
# async def send_to_agent(payload: dict):
#     async with httpx.AsyncClient() as client:
#         try:
#             print(f"🚀 Sending to Agent: {AGENT_SERVER_URL}")
#             resp = await client.post(AGENT_SERVER_URL, json=payload, timeout=10.0)
#             if resp.status_code == 200:
#                 print(f"✅ Agent Success: {resp.json()}")
#             else:
#                 print(f"⚠️ Agent Failed: {resp.text}")
#         except Exception as e:
#             print(f"❌ Connection Error: {e}")

# [수정] 결과를 반환하도록 변경된 전송 함수
async def send_to_agent(payload: dict) -> dict:
    # [변경] settings에서 URL 가져오기
    agent_url = settings.AGENT_BASE_URL
    
    async with httpx.AsyncClient() as client:
        try:
            print(f"🚀 Sending to Agent: {agent_url}")
            # 타임아웃을 넉넉하게 설정
            resp = await client.post(agent_url, json=payload, timeout=30.0)
            
            if resp.status_code == 200:
                data = resp.json()
                print(f"✅ Agent Success: {str(data)[:100]}...") 
                return data 
            else:
                print(f"⚠️ Agent Failed: {resp.text}")
                return {"error": "Agent server returned error", "details": resp.text}
                
        except Exception as e:
            print(f"❌ Connection Error: {e}")
            return {"error": "Failed to connect to Agent server", "details": str(e)}


@router.post("/preferences")
async def receive_user_preferences(
    preference_data: UserPreferenceCreate,
    # background_tasks: BackgroundTasks,  <-- 제거 (기다려야 하니까)
    current_user_payload: Optional[dict] = Depends(get_current_user_optional)
) -> Any:
    """
    [동기 처리] 프론트엔드 요청 -> 백엔드 -> Agent -> 결과 수신 -> 프론트엔드 응답
    """
    
    # 1. 유저 ID 결정
    final_user_id = preference_data.user_id 
    if current_user_payload:
        token_user_id = current_user_payload.get("sub") or current_user_payload.get("user_id")
        if token_user_id:
            final_user_id = token_user_id
    else:
        if not final_user_id:
            final_user_id = "guest_unknown"

    preference_data.user_id = final_user_id

    print(f"===== [Backend] RAG 요청 시작 (User: {final_user_id}) =====")
    
    # 2. [핵심 수정] Agent 서버로 보내고 결과를 기다림 (await)
    agent_result = await send_to_agent(preference_data.dict())
    
    # 3. 결과 반환 (recommendation 키에 Agent 결과를 담아줌)
    return {
        "status": "success", 
        "message": "추천이 완료되었습니다.",
        "user_type": "member" if current_user_payload else "guest",
        "received_data": preference_data,
        "recommendation": agent_result.get("recommendation", agent_result) # Agent 응답 구조에 따라 조정
    }


# @router.post("/preferences")
# async def receive_user_preferences(
#     preference_data: UserPreferenceCreate,
#     background_tasks: BackgroundTasks,
#     current_user_payload: Optional[dict] = Depends(get_current_user_optional)
# ) -> Any:
#     """
#     [하이브리드 모드]
#     1. 로그인한 유저(Token 있음) -> 토큰에서 user_id 추출 (신뢰도 높음)
#     2. 콜드스타트 유저(Token 없음) -> 프론트에서 보낸 user_id 사용 (테스트/비회원용)
#     """
    
#     # 1. 유저 ID 결정 로직
#     final_user_id = preference_data.user_id 

#     if current_user_payload:
#         # 로그인 된 상태라면 토큰의 ID를 신뢰하여 덮어씌움
#         token_user_id = current_user_payload.get("sub") or current_user_payload.get("user_id")
#         if token_user_id:
#             final_user_id = token_user_id
#             print(f"🔑 Authenticated User Detected: {final_user_id}")
#     else:
#         # 비로그인 상태
#         print(f"👻 Guest/Cold-Start User: {final_user_id}")
#         if not final_user_id:
#             final_user_id = "guest_unknown"

#     # 2. 데이터 업데이트 (결정된 user_id 반영)
#     preference_data.user_id = final_user_id

#     print(f"===== [Backend] 데이터 수신 (User: {final_user_id}) =====")
#     print(f"Cluster: {preference_data.cluster_id}")
    
#     # 3. 에이전트 서버로 전송 (Background Task)
#     background_tasks.add_task(send_to_agent, preference_data.dict())

#     # 4. (옵션) 로그인한 유저라면 DB 저장 로직 등을 여기에 추가 가능
#     # if current_user_payload:
#     #     save_to_db(...)

#     return {
#         "status": "success", 
#         "message": "데이터가 접수되어 추천 엔진으로 전송되었습니다.",
#         "user_type": "member" if current_user_payload else "guest",
#         "received_data": preference_data
#     }