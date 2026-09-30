import os
from dotenv import load_dotenv
from sqlmodel import create_engine, Session, select, text
from sqlalchemy.exc import OperationalError, ProgrammingError, ArgumentError

print("--- DB 연결 테스트 시작 ---")

# 1. .env 파일에서 환경 변수 불러오기
# (이 스크립트는 backend 폴더에서 실행해야 .env를 찾을 수 있습니다)
try:
    load_dotenv()
    print(".env 파일 로드 성공")
except Exception as e:
    print(f".env 파일 로드 실패: {e}")
    exit()

# 2. DATABASE_URL 읽어오기
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ [실패] .env 파일에 'DATABASE_URL'이 설정되지 않았습니다.")
    exit()

# 3. 비밀번호를 가려서 접속 시도 중인 호스트 정보 출력
try:
    host_info = DATABASE_URL.split('@')[-1]
    print(f"🔄 접속 시도 중: mysql+pymysql://USER:***@{host_info}")
except Exception:
    print("DATABASE_URL 형식이 잘못된 것 같습니다.")
    exit()

# 4. DB 연결 시도
try:
    engine = create_engine(DATABASE_URL)
    
    with Session(engine) as session:
        # 가장 간단한 쿼리(SELECT 1)를 실행하여 연결을 확인
        session.exec(select(1))
    
    print("\n✅ [성공] MySQL 데이터베이스에 성공적으로 연결되었습니다!")
    
    # 4. 'with' 구문으로 연결 (자동 닫힘)
    with engine.connect() as connection:
        print("🔄 DB 연결 성공. 'user_master' 테이블 Raw 쿼리 실행...")
        
        # 5. [핵심] Raw SQL 쿼리 실행
        query = text("SELECT * FROM user_master LIMIT 1")
        result = connection.execute(query)
        
        # 6. 첫 번째 row 가져오기
        row = result.fetchone()
        
        if row:
            print("\n✅ [성공] 'user_master' 테이블 조회 성공!")
            print("--- 첫 번째 유저 정보 (Raw) ---")
            # row 객체는 (값1, 값2, 값3...) 형태의 튜플로 반환됩니다.
            print(row)
            print("---------------------------------")
        else:
            print("\n⚠️  [성공] DB 연결 및 테이블 조회는 성공했으나, 'user_master' 테이블에 데이터가 없습니다.")

except ArgumentError as e:
    print("\n❌ [실패] DATABASE_URL 형식이 잘못되었습니다.")
    print("DB_NAME까지 모두 포함되었는지, mysql+pymysql://로 시작하는지 확인하세요.")
    print(f"\n[오류 상세 정보]\n{e}")

except OperationalError as e:
    print("\n❌ [실패] 데이터베이스에 연결할 수 없습니다.")
    print("USER, PASSWORD, HOST, PORT가 정확한지 확인하세요.")
    print("MySQL 서버가 실행 중인지, 방화벽이 3306 포트를 허용하는지 확인하세요.")
    print(f"\n[오류 상세 정보]\n{e}")
    
except Exception as e:
    print(f"\n❌ [실패] 예상치 못한 오류가 발생했습니다.")
    print(f"\n[오류 상세 정보]\n{e}")

print("\n--- DB 연결 테스트 종료 ---")