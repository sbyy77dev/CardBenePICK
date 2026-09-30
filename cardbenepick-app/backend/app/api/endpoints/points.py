from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func

from app.api import deps
from app.core.security import get_current_user_payload
# [수정된 부분: db insert] BenefitHistory 모델 임포트 추가
from app.db.models import PointLedger, PointBalance
from pydantic import BaseModel, Field

router = APIRouter()
    
# Request 모델
class PointEarnRequest(BaseModel):
    """포인트 적립 요청"""
    benefit_id: int = Field(..., description="사용한 혜택 ID")
    amount: int = Field(..., gt=0, description="결제 금액 (원)")
    description: Optional[str] = Field(None, max_length=255, description="적립 사유")


# Response 모델
class PointEarnResponse(BaseModel):
    """포인트 적립 응답"""
    message: str
    earned_point: int
    total_point: int
    created_at: datetime

class PointBalanceResponse(BaseModel):
    """포인트 잔액 조회 응답"""
    user_id: int
    total_point: int
    earn_count: int  # 적립 횟수
    last_updated_at: Optional[datetime]


@router.get("/balance", response_model=PointBalanceResponse)
def get_point_balance(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    현재 포인트 잔액 및 적립 횟수 조회
    - total_point: 현재 사용 가능한 포인트
    - earn_count: 지금까지 적립한 총 횟수 (point_ledger에서 계산)
    """
    user_id = payload.get("user_id")
    
    # 1. point_balance에서 잔액 조회
    point_balance = db.exec(
        select(PointBalance)
        .where(PointBalance.user_id == user_id)
    ).first()
    
    # 2. point_ledger에서 적립 횟수 계산
    earn_count = db.exec(
        select(func.count(PointLedger.id))
        .where(PointLedger.user_id == user_id)
        .where(PointLedger.type == "EARN")
    ).first() or 0
    
    if not point_balance:
        # 아직 포인트 적립 이력이 없는 경우
        return PointBalanceResponse(
            user_id=user_id,
            total_point=0,
            earn_count=0,
            last_updated_at=None
        )
    
    return PointBalanceResponse(
        user_id=user_id,
        total_point=point_balance.total_point,
        earn_count=earn_count,
        last_updated_at=point_balance.last_updated_at
    )


@router.post("/earn", response_model=PointEarnResponse)
def earn_points(
    request: PointEarnRequest,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    포인트 적립 API
    - 결제 금액의 2.5%를 포인트로 적립합니다.
    - point_ledger: 적립 이력 추가 (INSERT)
    - point_balance: 처음이면 생성(INSERT), 기존이면 업데이트(UPDATE)
    """
    user_id = payload.get("user_id")
    
    try:
        now = datetime.now().replace(microsecond=0)
        
        # 1. 포인트 계산 (2.5% 적립)
        earn_rate = 0.025
        earned_points = int(request.amount * earn_rate)
        
        if earned_points <= 0:
            raise HTTPException(
                status_code=400, 
                detail="적립 가능한 포인트가 없습니다. (최소 결제 금액: 40원)"
            )
        
        # 2. point_ledger에 적립 이력 추가 (항상 INSERT)
        ledger_entry = PointLedger(
            user_id=user_id,
            amount=earned_points,
            type="EARN",
            benefit_id=request.benefit_id,
            description=request.description or f"{request.amount:,}원 결제 {earn_rate*100}% 적립",
            created_at=now
        )
        db.add(ledger_entry)
        print(f"📝 [point_ledger] INSERT - user_id={user_id}, amount={earned_points}, card_id={request.benefit_id}")
        
        # 3. point_balance 조회
        point_balance = db.exec(
            select(PointBalance)
            .where(PointBalance.user_id == user_id)
        ).first()
        
        if not point_balance:
            # 3-1. 처음 적립하는 경우 - INSERT
            point_balance = PointBalance(
                user_id=user_id,
                total_point=earned_points,
                last_updated_at=now
            )
            db.add(point_balance)
            print(f"➕ [point_balance] INSERT - user_id={user_id}, total_point={earned_points}, earn_count=1")
        else:
            # 3-2. 기존 사용자 - UPDATE
            old_total = point_balance.total_point
            point_balance.total_point += earned_points
            point_balance.last_updated_at = now
            db.add(point_balance)  # SQLModel에서 변경사항 추적
            print(f"🔄 [point_balance] UPDATE - user_id={user_id}, total_point: {old_total} → {point_balance.total_point}")
        
        # 4. 커밋 및 적립 횟수 재계산
        db.commit()
        db.refresh(point_balance)
        
        # 5. 적립 횟수 조회 (EARN 타입만 카운트)
        earn_count = db.exec(
            select(func.count(PointLedger.id))
            .where(PointLedger.user_id == user_id)
            .where(PointLedger.type == "EARN")
        ).first() or 0
        
        print(f"💰 [포인트 적립 완료] user_id={user_id}, +{earned_points}P (총 잔액: {point_balance.total_point}P, 적립 횟수: {earn_count}회)")
        
        return PointEarnResponse(
            message="포인트가 적립되었습니다.",
            earned_point=earned_points,
            total_point=point_balance.total_point,
            created_at=now
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"🚨 [포인트 적립 실패] {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="포인트 적립 중 오류가 발생했습니다.")