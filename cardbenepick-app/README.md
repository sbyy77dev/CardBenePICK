# 💳 CardBenePICK - APP

> **사용자 맞춤형 카드 혜택 추천 및 마이데이터 소비 분석 서비스**

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React (Vite)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, Shadcn UI
* **State Management:** Zustand
* **Communication:** Axios

### Backend
* **Framework:** FastAPI (Python 3.10+)
* **Database:** MySQL (8.0+)
* **ORM:** SQLModel (SQLAlchemy + Pydantic)
* **Auth:** JWT (JSON Web Token)

### AI & Data (Planned)
* **LLM & Agent:** LangChain, MCP (Model Context Protocol), RAG(Retrieval-Augmented Generation)
* **Pipeline:** Apache Airflow

---

## 📂 Project Structure (Monorepo)

이 프로젝트는 하나의 레포지토리에서 프론트엔드와 백엔드를 함께 관리합니다.

```bash
cardbenepick-app/
├── backend/            # FastAPI 서버
│   ├── app/
│   │   ├── api/        # API 엔드포인트
│   │   ├── core/       # 설정 및 보안
│   │   ├── db/         # DB 세션 및 모델
│   │   └── schemas/    # Pydantic 모델
│   ├── check_db_simple.py # DB 연결 테스트 스크립트
│   └── requirements.txt
│
└── frontend/           # React 클라이언트
    ├── src/
    │   ├── components/ # UI 및 도메인 컴포넌트
    │   ├── lib/api/    # 백엔드 API 호출 함수
    │   ├── pages/      # 페이지 (기능별 폴더링)
    │   └── store/      # 전역 상태 (Zustand)
    └── package.json
```
## 🚀 Getting Started
1. Prerequisites (사전 준비)
Node.js (v18+)
Python (v3.10+)
MySQL Server

2. Backend Setup (백엔드 실행)
터미널을 열고 backend 폴더로 이동합니다.


```bash
cd backend
```

가상환경 생성 및 패키지 설치:
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
.\venv\Scripts\activate
# 가상환경 활성화 (Mac/Linux)
# source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```
환경 변수 설정 (.env): backend/.env 파일을 생성하고 아래 내용을 입력하세요.
```bash
DATABASE_URL=mysql+pymysql://USER:PASSWORD@localhost:3306/cardbenepick_db
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```
서버 실행:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Swagger UI 접속: http://localhost:8000/docs
```
3. Frontend Setup (프론트엔드 실행)
새 터미널을 열고 frontend 폴더로 이동합니다.
```
```bash
cd frontend
```
패키지 설치 및 실행:
```bash
npm install
npm run dev
#  ➜  Local:   http://localhost:/
```
