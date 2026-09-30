import os
import json
from typing import List
# [수정] SettingsConfigDict를 pydantic_settings에서 함께 임포트
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# Pydantic을 사용하여 환경 변수 정의 및 유효성 검사
class Settings(BaseSettings):
    # [일반 설정]
    API_V1_STR: str = "/api/v1" # V1 접두사를 기본값으로 명확히 지정
    
    # [DB 설정]
    # 💡 주의: os.getenv를 사용하지 않고 바로 타입만 지정해야 Pydantic이 env에서 값을 찾습니다.
    DATABASE_URL: str
    AGENT_BASE_URL: str = os.getenv("AGENT_BASE_URL", "http://localhost:8090")
    ML_BASE_URL: str = os.getenv("ML_BASE_URL", "http://localhost:9000")

    # [보안 설정]
    SECRET_KEY: str = os.getenv("SECRET_KEY", "temporary-secret-key-please-change")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7일
    REGISTRATION_TOKEN_EXPIRE_MINUTES: int = 10
    
    # [CORS 설정 - 핵심]
    # .env에서 쉼표로 구분된 문자열을 받아 List[str]로 변환합니다.
    BACKEND_CORS_ORIGINS: List[str] = []

    # [이미지 경로 설정]
    IMAGE_BASE_URL: str = os.getenv("IMAGE_BASE_URL", "http://localhost:8000/images")

    # [UVICORN 설정]
    UVICORN_HOST: str = os.getenv("UVICORN_HOST", "0.0.0.0")
    UVICORN_PORT: int = int(os.getenv("UVICORN_PORT", 8000))
    
    # [Pydantic v2 설정]
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file = ".env",
        extra='ignore' # env에 불필요한 값이 있어도 무시 (안정성 강화)
    )

# 전역 설정 객체 생성
settings = Settings()

# 💡 참고: CORS Origins 문자열을 파싱합니다.
# .env에서 ["http://a.com", "http://b.com"] 형태로 받거나, "http://a.com, http://b.com" 형태로 받을 때 모두 처리합니다.
if isinstance(settings.BACKEND_CORS_ORIGINS, str):
    try:
        # 1. JSON 문자열인 경우 파싱 시도
        settings.BACKEND_CORS_ORIGINS = json.loads(settings.BACKEND_CORS_ORIGINS)
    except json.JSONDecodeError:
        # 2. JSON이 아닌 일반 문자열인 경우 쉼표로 분리 (가장 안전한 레거시 호환성 확보)
        settings.BACKEND_CORS_ORIGINS = [
            uri.strip() for uri in settings.BACKEND_CORS_ORIGINS.split(',')
        ]

DATABASE_URL: str = os.getenv("DATABASE_URL")
SECRET_KEY: str = os.getenv("SECRET_KEY")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
# # 60분 * 24시간 * 7일 = 7일
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60 * 24 * 7)) 
# # OTP 인증 후 회원가입을 완료하기 위한 임시 토큰 (10분)
REGISTRATION_TOKEN_EXPIRE_MINUTES: int = 10

# # [추가] 카드 이미지 기본 경로
# # frontend/vite.config.ts에 설정된 포트(8080)를 반영
# IMAGE_BASE_URL: str = "http://localhost:8080/images"