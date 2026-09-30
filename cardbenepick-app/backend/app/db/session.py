# DB 엔진과 세션 주입 함수
from sqlmodel import create_engine, Session, SQLModel
from app.core.config import settings

# DB 엔진 생성 (앱 생명주기 동안 한번만)
# echo=True는 개발 중 쿼리 로그 확인용 (배포 시 False)
engine = create_engine(settings.DATABASE_URL, echo=True) 

def init_db():
    # SQLModel.metadata.create_all()은
    # backend/app/db/models.py 파일이 import된 후에 호출되어야 함
    SQLModel.metadata.create_all(engine)

def get_db():
    """API 엔드포인트에서 사용할 DB 세션 의존성"""
    with Session(engine) as session:
        yield session