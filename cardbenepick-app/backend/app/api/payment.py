from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class PaymentResult(BaseModel):
    payment_id: str
    payment_amount: int
    discount_amount: int
    final_amount: int
    reward_amount: int
    card_name: str
    merchant: str
    created_at: datetime

@router.get("/api/payment/{payment_id}")
async def get_payment_result(payment_id: str):
    # 실제로는 DB에서 조회
    # payment = db.query(Payment).filter(Payment.id == payment_id).first()
    
    # 예시 데이터
    discount = 3800  # 할인 금액
    reward = int(discount * 2.5 / 100)  # 95원 적립
    
    return {
        "payment_id": payment_id,
        "payment_amount": 38000,
        "discount_amount": discount,
        "final_amount": 34200,
        "reward_amount": reward,
        "card_name": "신한 Deep Dream",
        "merchant": "스타벅스 강남점",
        "created_at": datetime.now()
    }

@router.post("/api/reward/save")
async def save_reward(user_id: str, amount: int):
    # 적립금을 DB에 저장
    # reward = Reward(user_id=user_id, amount=amount, created_at=datetime.now())
    # db.add(reward)
    # db.commit()
    
    return {"status": "success", "saved_amount": amount}
