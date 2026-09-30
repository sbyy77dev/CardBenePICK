# DB 테이블(`user_master`, `user_assets`) 정의
import enum
from typing import Optional, List, Any
from decimal import Decimal
from datetime import datetime, date
from sqlmodel import SQLModel, Field, Column, Enum as SQLAEnum, text

# 3. SQLAlchemy에서 필요한 타입들 임포트
from sqlalchemy import CHAR, BINARY, VARBINARY, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.dialects.mysql import BIGINT, DECIMAL as SQLDecimal, TINYINT
# --- Enums (DB 스키마와 동일하게) ---
class Gender(str, enum.Enum):
    M = "M"
    F = "F"

class UserStatus(str, enum.Enum):
    active = "active"
    blocked = "blocked"
    deleted = "deleted"

class AssetType(str, enum.Enum):
    card = "card"
    account = "account"
    loan = "loan"
    investment = "investment"
    cash = "cash"
    etc = "etc"

# --- Tables ---

# --- UserMaster ---
class UserMaster(SQLModel, table=True):
    __tablename__ = "user_master"

    # [FIXED] primary_key를 Field()가 아닌 Column()으로 이동
    user_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    
    # [FIXED] unique를 Field()가 아닌 Column()으로 이동
    uuid: Optional[bytes] = Field(default=None, sa_column=Column(BINARY(16), unique=True))
    user_name: Optional[str] = Field(max_length=50, default=None)
    birth_date: Optional[date] = Field(default=None)
    gender: Optional[Gender] = Field(default=None, sa_column=Column(SQLAEnum(Gender)))
    telecom: Optional[str] = Field(default=None, max_length=20)
    
    # [FIXED] unique를 Field()가 아닌 Column()으로 이동
    ci_hash: Optional[bytes] = Field(default=None, sa_column=Column(VARBINARY(32), unique=True))
    di_hash: Optional[bytes] = Field(default=None, sa_column=Column(VARBINARY(32), unique=True))
    
    # [OK] sa_column이 없으므로 Field()에 unique, index 설정 가능
    phone_number: str = Field(max_length=20, unique=True, index=True, nullable=False)

    status: UserStatus = Field(
        default=UserStatus.active, 
        sa_column=Column(SQLAEnum(UserStatus), index=True, nullable=False, server_default=UserStatus.active.value)
    )
    last_login_at: Optional[datetime] = Field(default=None)
    
    # [REVISED] sa_column_kwargs 대신 Column으로 통일
    created_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    )

# --- UserAsset ---
class UserAsset(SQLModel, table=True):
    __tablename__ = "user_assets"

    # [FIXED] primary_key를 Field()가 아닌 Column()으로 이동
    asset_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    
    # [FIXED] foreign_key와 index를 Field()가 아닌 Column()으로 이동
    user_id: int = Field(
        sa_column=Column(
            BIGINT(unsigned=True), 
            ForeignKey("user_master.user_id"), 
            index=True, 
            nullable=False
        )
    )
    
    asset_type: AssetType = Field(sa_column=Column(SQLAEnum(AssetType), index=True, nullable=False))
    institution_name: str = Field(max_length=100, nullable=False)
    
    # [OK] sa_column이 없으므로 Field()에 index 설정 가능
    external_account_id: str = Field(max_length=100, index=True, nullable=False)    # 다른 table의 card_id와 매핑되는 값 13,51 등
    external_account_name: Optional[str] = Field(max_length=200, default=None)

    # [REVISED] nullable=False 중복 제거 (Column 내부에만 명시)
    currency: str = Field(
        default="KRW", 
        sa_column=Column(CHAR(3), nullable=False, server_default="KRW")
    )
    
    balance: Decimal = Field(
        default=Decimal("0.00"), 
        sa_column=Column(SQLDecimal(18, 2), nullable=False, server_default=text("'0.00'"))
    )

    # [REVISED] sa_column_kwargs 대신 Column으로 통일
    created_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, # Pydantic 모델을 위한 기본값
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))
    )

# --- CardMaster ---
class CardMaster(SQLModel, table=True):
    """
    카드 상품 마스터 정보
    """
    __tablename__ = "card_master"

    # card_id는 문자열(varchar(64))로 정의되어 있음
    card_id: str = Field(primary_key=True, max_length=64)
    
    card_name: str = Field(max_length=128, nullable=False)
    card_company: str = Field(max_length=64, nullable=False, index=True) # 인덱스 반영
    
    card_rank: Optional[int] = Field(default=None)
    
    # card_type: 0=신용, 1=체크 등 (TINYINT 매핑)
    card_type: int = Field(sa_column=Column(TINYINT, nullable=False))
    
    domestic_year_cost: Optional[int] = Field(default=None)
    abroad_year_cost: Optional[int] = Field(default=None)
    previous_month_performance: Optional[int] = Field(default=None)
    
    created_at: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    )
    
    # JSON 타입 컬럼 매핑 (주의: MySQL에서 JSON 타입 지원 필요)
    json_notice: Optional[Any] = Field(default=None, sa_column=Column(JSON))

# --- CardTransaction ---
class CardTransaction(SQLModel, table=True):
    """
    사용자 카드 결제 내역 (파티셔닝 적용된 테이블)
    """
    __tablename__ = "card_transactions"

    # id와 transaction_date가 복합 PK로 설정되어 있으나,
    # SQLModel에서 복합 PK 설정이 복잡할 수 있으므로 id를 primary key로 지정하고
    # 실제 DB 제약조건은 DB 스키마를 따름.
    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    
    transaction_id: str = Field(max_length=64, nullable=False) # UNIQUE KEY (with date)
    
    user_id: int = Field(
        sa_column=Column(BIGINT(unsigned=True), nullable=False, index=True)
    )
    
    card_id: str = Field(max_length=64, nullable=False, index=True)
    card_company: str = Field(max_length=64, nullable=False, index=True)
    
    transaction_date: datetime = Field(nullable=False, primary_key=True) # 복합 PK의 일부이므로 PK 표시
    
    merchant_name: Optional[str] = Field(max_length=128, default=None, index=True)
    amount_krw: int = Field(nullable=False)
    installment_months: int = Field(default=0, nullable=False)
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )


# --- [수정된 부분: db insert] BenefitHistory 추가 ---
class BenefitHistory(SQLModel, table=True):
    """
    카드 혜택 적용 내역 (benefit_history 테이블)
    """
    __tablename__ = "benefit_history"

    usage_id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )
    user_id: int = Field(sa_column=Column(BIGINT, nullable=False))
    
    # benefit_id는 varchar(16)
    benefit_id: str = Field(max_length=16, nullable=False)
    
    # transaction_id는 varchar(64)
    transaction_id: str = Field(max_length=64, nullable=False)
    
    applied_amount: int = Field(nullable=False) # 적용된 혜택 금액
    usage_date: datetime = Field(nullable=False)
    
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )

# --- [추가] BenefitSum ---
class BenefitSum(SQLModel, table=True):
    """
    혜택 한도 관리 및 집계를 위한 요약 테이블 (benefit_sum)
    """
    __tablename__ = "benefit_sum"

    # 복합 PK (user_id, benefit_id)
    user_id: int = Field(sa_column=Column(BIGINT, primary_key=True, nullable=False))
    benefit_id: str = Field(max_length=16, primary_key=True, nullable=False)

    day_amount: Optional[int] = Field(default=0, sa_column=Column(BIGINT))
    day_count: Optional[int] = Field(default=0)

    week_amount: Optional[int] = Field(default=0, sa_column=Column(BIGINT))
    week_count: Optional[int] = Field(default=0)

    month_amount: Optional[int] = Field(default=0, sa_column=Column(BIGINT))
    month_count: Optional[int] = Field(default=0)

    year_amount: Optional[int] = Field(default=0, sa_column=Column(BIGINT))
    year_count: Optional[int] = Field(default=0)

# --- Notification ---
class Notification(SQLModel, table=True):
    """
    사용자 알림함 테이블 매핑
    """
    __tablename__ = "notifications"

    # [ID] PK, AutoIncrement (UserMaster, UserAsset과 동일한 방식)
    id: Optional[int] = Field(
        default=None,
        sa_column=Column(BIGINT(unsigned=True), primary_key=True, autoincrement=True)
    )

    # [User ID] FK (UserAsset과 동일한 방식)
    user_id: int = Field(
        sa_column=Column(
            BIGINT(unsigned=True), 
            ForeignKey("user_master.user_id"), 
            index=True, 
            nullable=False
        )
    )

    # [Alarm Type] 1: 카드혜택, 2: 공지사항 등
    alarm_type: int = Field(nullable=False)

    # [Content] JSON 데이터 (CardMaster의 json_notice와 동일한 방식)
    content: Any = Field(sa_column=Column(JSON, nullable=False))

    # [Read At] 읽은 시간 (Null이면 안 읽음)
    read_at: Optional[datetime] = Field(default=None)

    # [Link URL] 클릭 시 이동할 주소
    link_url: Optional[str] = Field(default=None, max_length=2083)

    # [Is Active] 숨김 처리 여부 (Boolean 타입 사용)
    is_active: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, server_default=text("true"))
    )

    # [Created At] 생성 시간
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    )

# --- [추가] CardBenefit ---
class CardBenefit(SQLModel, table=True):
    """
    카드 혜택 상세 정보 (card_benefit 테이블)
    """
    __tablename__ = "card_benefit"

    benefit_id: str = Field(primary_key=True, max_length=16)
    
    # FK: card_master.card_id와 연결
    card_id: str = Field(max_length=64, nullable=False, index=True) 
    
    category: str = Field(max_length=64, nullable=False, index=True) # 혜택 카테고리
    summary: Optional[str] = Field(default=None, max_length=255)     # 혜택 요약
    
    # JSON 데이터 (상세 설명 등)
    json_rawdata: Optional[Any] = Field(default=None, sa_column=Column(JSON))
    
    # MCC 코드 (업종 코드)
    mcc_code: Optional[Any] = Field(default=None, sa_column=Column(JSON))


class PointLedger(SQLModel, table=True):
    """포인트 변동 이력 (원장)"""
    __tablename__ = "point_ledger"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(..., index=True)
    amount: int = Field(..., description="양수: 적립, 음수: 사용")
    type: str = Field(..., max_length=20, description="EARN, USE, CANCEL, EXPIRE")
    used_benefit_id: Optional[int] = Field(default=None)
    description: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=lambda: datetime.now().replace(microsecond=0))

class PointBalance(SQLModel, table=True):
    """사용자별 포인트 잔액"""
    __tablename__ = "point_balance"
    
    user_id: int = Field(primary_key=True)
    total_point: int = Field(default=0)
    earn_count: int = Field(default=0)
    last_updated_at: datetime = Field(default_factory=lambda: datetime.now().replace(microsecond=0))