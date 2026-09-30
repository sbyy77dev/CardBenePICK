# API 입/출력용 Pydantic 모델
from sqlmodel import SQLModel
from datetime import date
from app.db.models import Gender

class SendOtpRequest(SQLModel):
    phone_number: str

class VerifyOtpRequest(SQLModel):
    phone_number: str
    otp: str

class VerifyOtpResponse(SQLModel):
    """OTP 검증 응답. 토큰과 신규 유저 여부를 반환"""
    token: str      # JWT 토큰 (로그인용 또는 회원가입용)
    is_new_user: bool

class RegisterRequest(SQLModel):
    """회원가입 완료 요청"""
    name: str
    telecom: str
    birth_date: date  # <-- [추가]
    gender: Gender    # <-- [추가]
    agreed_terms: bool
    agreed_privacy: bool

class Token(SQLModel):
    """최종 로그인 토큰 응답"""
    access_token: str
    token_type: str = "bearer"

class MessageResponse(SQLModel):
    """단순 메시지 응답"""
    message: str