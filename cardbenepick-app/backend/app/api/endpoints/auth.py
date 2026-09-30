# 핵심 로직. OTP 생성, 검증, DB 저장을 처리
import random
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, date
import uuid as uuid_pkg  # <-- 2. uuid_pkg 추가
from app.api import deps
from app.db.models import UserMaster, UserStatus, Gender
from app.core.security import create_access_token, create_registration_token
from app.schemas.token import (
    SendOtpRequest, VerifyOtpRequest, VerifyOtpResponse, 
    RegisterRequest, Token, MessageResponse
)

router = APIRouter()

# [로컬 개발용 임시 OTP 저장소]
# (주의: AWS 배포 시 이 변수는 작동하지 않으며, Redis로 교체해야 합니다.)
temp_otp_storage = {}

@router.post("/auth/send-otp", response_model=MessageResponse)
def send_otp(request: SendOtpRequest):
    """
    휴대폰 번호를 받아 6자리 OTP를 생성하고 (임시)저장합니다.
    [개발] 현재는 OTP를 콘솔에 출력합니다.
    """
    phone_number = request.phone_number
    # (1) 6자리 랜덤 OTP 생성
    otp = str(random.randint(100000, 999999))
    
    # (2) [로컬 개발용] 임시 변수에 OTP 저장
    temp_otp_storage[phone_number] = otp
    
    # (3) [로컬 개발용] 백엔드 콘솔에 OTP를 출력 (프론트 개발자는 이걸 보고 입력)
    print(f"--- [OTP 발송] ---")
    print(f"대상: {phone_number}")
    print(f"인증번호: {otp}")
    print(f"------------------")
    
    return MessageResponse(message="OTP sent (check console)")

@router.post("/auth/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(request: VerifyOtpRequest, db: Session = Depends(deps.get_db)):
    """
    휴대폰 번호와 OTP를 검증합니다.
    - 기존 유저: 로그인 토큰 발급
    - 신규 유저: 회원가입용 임시 토큰 발급
    """
    phone_number = request.phone_number
    otp = request.otp

    # (1) [로컬 개발용] 임시 변수에서 OTP 조회
    correct_otp = temp_otp_storage.get(phone_number)
    
    if not correct_otp or correct_otp != otp:
        raise HTTPException(status_code=400, detail="인증번호가 올바르지 않습니다.")

    # (2) 인증 성공 시 OTP 즉시 삭제 (일회용)
    if phone_number in temp_otp_storage:
        del temp_otp_storage[phone_number]

    # (3) DB에서 유저 조회
    user = db.exec(
        select(UserMaster).where(UserMaster.phone_number == phone_number)
    ).first()

    if user:
        # --- [기존 유저 (로그인)] ---
        user.last_login_at = datetime.utcnow()
        db.add(user)
        db.commit()
        
        # (4) 정식 로그인 토큰 발급 (만료 시간 7일)
        access_token = create_access_token(
            data={"sub": user.phone_number, "user_id": user.user_id}
        )
        return VerifyOtpResponse(token=access_token, is_new_user=False)
    else:
        # --- [신규 유저 (회원가입 필요)] ---
        
        # (5) 회원가입 2단계(Register.tsx)에서 사용할 임시 토큰 발급 (만료 시간 10분)
        reg_token = create_registration_token(
            data={"sub": phone_number}
        )
        return VerifyOtpResponse(token=reg_token, is_new_user=True)

@router.post("/auth/complete-registration", response_model=Token)
def complete_registration(
    request: RegisterRequest, 
    db: Session = Depends(deps.get_db),
    # (1) 헤더의 Bearer 토큰을 검증하고, 그 내용(payload)을 가져옴
    payload: dict = Depends(deps.get_current_user_payload) 
):
    """
    [인증 필요] VerifyOtp에서 받은 임시 토큰으로 회원가입을 완료합니다.
    """
    phone_number = payload.get("sub")
    token_type = payload.get("type")

    # (2) 이 엔드포인트는 'registration' 타입의 임시 토큰만 허용
    if token_type != "registration" or not phone_number:
        raise HTTPException(status_code=403, detail="Invalid token for registration")

    # (3) (방어 코드) 이미 가입된 유저인지 다시 확인
    user = db.exec(select(UserMaster).where(UserMaster.phone_number == phone_number)).first()
    if user:
        raise HTTPException(status_code=400, detail="User already exists")

    # (4) 약관 동의 확인
    if not request.agreed_terms or not request.agreed_privacy:
        raise HTTPException(status_code=400, detail="Terms must be agreed")

    # (5) --- [핵심] user_master에 유저 생성 ---
    new_user = UserMaster(
    phone_number=phone_number,
    user_name=request.name,
    status=UserStatus.active,

    # --- [추가된 더미 데이터] ---
    # (DB 스키마가 NOT NULL 컬럼을 요구하므로 임시 값을 채웁니다)
    uuid=uuid_pkg.uuid4().bytes,
    birth_date=request.birth_date,
    gender=request.gender,
    telecom=request.telecom,
    ci_hash=f"dummy-ci-{phone_number}".encode('utf-8').ljust(32, b'\0'), # 32바이트 더미
    di_hash=f"dummy-di-{phone_number}".encode('utf-8').ljust(32, b'\0'), # 32바이트 더미
    created_at=datetime.utcnow(), # `text("...")`를 썼으므로 모델에서 제거해도 되나, 명시적으로 추가
    updated_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # (6) --- 로그인 (정식 액세스 토큰 발급) ---
    access_token = create_access_token(
        data={"sub": new_user.phone_number, "user_id": new_user.user_id}
    )
    return Token(access_token=access_token)