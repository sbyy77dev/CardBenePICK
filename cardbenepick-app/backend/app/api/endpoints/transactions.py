import uuid
import traceback # [추가] 상세 에러 로그용
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, desc, extract, func, select, SQLModel

from app.db import session
from app.core import security
from app.core.security import get_current_user_payload
# [수정된 부분: db insert] BenefitHistory 모델 임포트 추가
from app.db.models import UserAsset, CardTransaction, BenefitHistory, BenefitSum
from app.schemas.response import TransactionResponse
router = APIRouter()

class PaymentRequest(SQLModel):
    user_asset_id: int
    amount: int
    merchant_name: str
    installment: int = 0
    # [수정된 부분: db insert] 혜택 정보 필드 추가 (Optional)
    benefit_id: Optional[str] = None
    discount_amount: Optional[int] = 0

@router.post("/pay")
def process_payment(
    request: PaymentRequest,
    db: Session = Depends(session.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    [결제 시뮬레이션] 선택한 카드로 결제를 승인합니다.
    """
    user_id = payload.get("user_id")
    
    # 1. 내 자산인지 확인
    asset = db.exec(
        select(UserAsset)
        .where(UserAsset.asset_id == request.user_asset_id)
        .where(UserAsset.user_id == user_id)
    ).first()

    if not asset:
        raise HTTPException(status_code=404, detail="유효하지 않은 카드입니다.")

    try:
        # [Fix 1] 마이크로초 제거 (MySQL DATETIME과 정밀도 일치시키기)
        # 이렇게 해야 저장 후 refresh 할 때 PK 불일치 에러가 안 남
        now = datetime.now().replace(microsecond=0)

        tx_id = str(uuid.uuid4())
        # 2. 거래 내역 생성
        new_tx = CardTransaction(
            transaction_id= tx_id,
            user_id=user_id,
            card_id=asset.external_account_id, 
            card_company=asset.institution_name,
            transaction_date=now, # [수정] 정제된 시간 사용
            merchant_name=request.merchant_name,
            amount_krw=request.amount,
            installment_months=request.installment
        )

        db.add(new_tx)
        # --- [디버깅 추가] ---
        # print("="*30)
        # print(f"DEBUG: 요청 받은 benefit_id: {request.benefit_id}")
        # print(f"DEBUG: 요청 받은 discount_amount: {request.discount_amount}")
        
        # [수정된 부분: db insert] 혜택 이력 생성 (benefit_id가 있고 할인 금액이 0보다 클 때)
        if request.benefit_id and request.discount_amount and request.discount_amount > 0:
            # print("DEBUG: >> IF 조건문 진입 성공!")
            new_benefit = BenefitHistory(
                user_id=user_id,
                benefit_id=request.benefit_id,
                transaction_id=tx_id, # 위에서 생성한 tx_id 연결
                applied_amount=request.discount_amount,
                usage_date=now
            )
            # [요청하신 부분] new_benefit 내용 출력
            # print(f"DEBUG: 생성된 new_benefit 객체: {new_benefit}")
            db.add(new_benefit)
        # else:
            # print("DEBUG: >> 조건 불충족으로 BenefitHistory 생성 건너뜀")
        # print("="*30)
        
        # DB에 먼저 반영해야 아래 조회 시 포함됨 (같은 트랜잭션 내 flush)
            db.flush() 

            # (2) 기간별 합계 계산 (Sum)
            # 기준 시간 설정
            today_start = now.replace(hour=0, minute=0, second=0)
            week_start = today_start - timedelta(days=today_start.weekday()) # 월요일 시작 기준
            month_start = today_start.replace(day=1)
            year_start = today_start.replace(month=1, day=1)

            # 해당 사용자의 해당 혜택 전체 이력 조회 (올해 데이터만 가져와서 필터링하는 것이 효율적)
            # year_start 이상인 데이터만 가져와서 파이썬에서 계산
            history_rows = db.exec(
                select(BenefitHistory)
                .where(BenefitHistory.user_id == user_id)
                .where(BenefitHistory.benefit_id == request.benefit_id)
                .where(BenefitHistory.usage_date >= year_start)
            ).all()

            # 파이썬 레벨에서 집계
            d_amt, d_cnt = 0, 0
            w_amt, w_cnt = 0, 0
            m_amt, m_cnt = 0, 0
            y_amt, y_cnt = 0, 0

            for row in history_rows:
                # Year
                y_amt += row.applied_amount
                y_cnt += 1
                
                # Month
                if row.usage_date >= month_start:
                    m_amt += row.applied_amount
                    m_cnt += 1
                
                # Week
                if row.usage_date >= week_start:
                    w_amt += row.applied_amount
                    w_cnt += 1
                
                # Day
                if row.usage_date >= today_start:
                    d_amt += row.applied_amount
                    d_cnt += 1

            # (3) BenefitSum 테이블 업데이트 (없으면 생성, 있으면 갱신)
            benefit_sum = db.exec(
                select(BenefitSum)
                .where(BenefitSum.user_id == user_id)
                .where(BenefitSum.benefit_id == request.benefit_id)
            ).first()

            if not benefit_sum:
                benefit_sum = BenefitSum(user_id=user_id, benefit_id=request.benefit_id)
            
            # 값 갱신
            benefit_sum.day_amount = d_amt
            benefit_sum.day_count = d_cnt
            benefit_sum.week_amount = w_amt
            benefit_sum.week_count = w_cnt
            benefit_sum.month_amount = m_amt
            benefit_sum.month_count = m_cnt
            benefit_sum.year_amount = y_amt
            benefit_sum.year_count = y_cnt

            db.add(benefit_sum)
            print(f"DEBUG: BenefitSum 업데이트 완료 - ID: {request.benefit_id}, 월 사용액: {m_amt}")

        db.commit()
        db.refresh(new_tx) 

        return {
            "message": "결제가 승인되었습니다.",
            "transaction_id": new_tx.transaction_id,
            "amount": new_tx.amount_krw,
            "merchant": new_tx.merchant_name,
            "approved_at": new_tx.transaction_date,
            "benefit_applied": bool(request.benefit_id and request.discount_amount > 0)
        }

    except Exception as e:
        db.rollback()
        # [Fix 2] 상세 에러 로그 출력 (원인 파악용)
        print("="*50)
        print("🚨 결제 처리 중 에러 발생 (Traceback)")
        print("="*50)
        traceback.print_exc() # 에러가 발생한 정확한 파일 위치와 원인을 출력
        print(f"Error Details: {e}")
        print("="*50)
        
        raise HTTPException(status_code=500, detail="결제 처리 중 오류가 발생했습니다.")
    
@router.get("/history/{card_id}", response_model=List[TransactionResponse])
def read_card_history(
    card_id: int,
    year: int,
    month: int,
    db: Session = Depends(session.get_db),
    current_user_payload = Depends(security.get_current_user_payload)
):
    """
    특정 카드의 월별 거래 내역 조회 (혜택 내역 포함)
    """
    # [핵심 수정] 딕셔너리에서 user_id 추출
    user_id = current_user_payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: user_id missing")

    # Transaction과 BenefitHistory를 조인하여 조회
    # Transaction 필드 전체와 BenefitHistory의 discount_amount를 가져옵니다.
    # BenefitHistory가 없을 수도 있으므로 outerjoin(Left Join) 사용
    statement = (
        select(CardTransaction, func.coalesce(BenefitHistory.applied_amount, 0).label("discount_amount"))
        .outerjoin(BenefitHistory, CardTransaction.transaction_id == BenefitHistory.transaction_id)
        .where(CardTransaction.user_id == user_id)
        .where(CardTransaction.card_id == card_id)
        .where(extract('year', CardTransaction.transaction_date) == year)
        .where(extract('month', CardTransaction.transaction_date) == month)
        .order_by(desc(CardTransaction.transaction_date))
    )
    
    try:
        results = db.exec(statement).all()
        
        response_data = []
        for tx, discount in results:
            # Transaction 모델 데이터를 dict로 변환
            tx_data = tx.model_dump()
            # discount_amount 추가
            tx_data["discount_amount"] = discount
            
            # TransactionResponse로 변환
            response_data.append(TransactionResponse(**tx_data))
            
        return response_data

    except Exception as e:
        print(f"Error fetching card history: {e}")
        raise HTTPException(status_code=500, detail=str(e))