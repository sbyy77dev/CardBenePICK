# JWT 토큰 생성 및 검증 로직
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REGISTRATION_TOKEN_EXPIRE_MINUTES
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from starlette import status

# Bearer 토큰 스키마
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login") # (실제 폼 로그인은 안쓰지만 스키마용)

# --- JWT 생성 ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """일반 로그인용 액세스 토큰 생성"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_registration_token(data: dict):
    """OTP 인증만료된 유저가 회원가입을 완료하기 위한 임시 토큰 (10분)"""
    expires = timedelta(minutes=REGISTRATION_TOKEN_EXPIRE_MINUTES)
    # "type": "registration" 플래그를 추가하여 일반 액세스 토큰과 구분
    to_encode = data.copy()
    to_encode.update({"type": "registration"})
    return create_access_token(to_encode, expires_delta=expires)

# --- JWT 검증 ---

def verify_token(token: str, credentials_exception: HTTPException) -> dict:
    """토큰을 검증하고 페이로드(내용물)를 반환"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # 'sub' (subject)는 보통 유저의 고유 식별자(여기선 phone_number)를 담습니다.
        phone_number: str = payload.get("sub")
        if phone_number is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception

def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """API에서 현재 로그인된 유저의 토큰 페이로드를 가져오는 의존성"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    return verify_token(token, credentials_exception)