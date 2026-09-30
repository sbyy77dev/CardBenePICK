from typing import Optional
from datetime import datetime, date
from sqlmodel import SQLModel
from app.db.models import Gender, UserStatus, AssetType

class UserResponse(SQLModel):
    user_id: int
    user_name: Optional[str]
    phone_number: str
    birth_date: Optional[date]
    gender: Optional[Gender]
    telecom: Optional[str]
    status: UserStatus
    created_at: datetime

class AssetResponse(SQLModel):
    asset_id: int
    institution_name: str  # 카드사명 (예: 신한카드)
    external_account_id: str # 카드 ID (예: 13)
    external_account_name: Optional[str] # 카드 상품명 (예: 신한카드 Mr.Life)
    asset_type: AssetType
    created_at: datetime
    # card_master 정보를 조인해서 보여줄 경우를 위해 이미지 URL 등을 추가할 수도 있음
    card_image_url: Optional[str] = None

# [수정] 거래 내역 응답 스키마에 할인 금액 추가
class TransactionResponse(SQLModel):
    id: int
    transaction_id: str
    user_id: int
    card_id: int
    transaction_date: datetime
    merchant_name: str
    amount_krw: int
    installment_months: int
    # approval_number: str
    card_company: Optional[str] = None
    
    # [추가] 혜택 내역에서 가져올 할인 금액
    discount_amount: Optional[int] = 0