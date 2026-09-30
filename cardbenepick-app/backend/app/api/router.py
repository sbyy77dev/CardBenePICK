# 모든 라우터를 통합
from fastapi import APIRouter
from app.api.endpoints import auth, assets, users, transactions, notifications, analysis, points

api_router = APIRouter()

# 인증 라우터 등록
api_router.include_router(auth.router, tags=["Authentication"])

# 자산(Assets) 라우터 등록
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])
# (나중에 /users, /cards 등 다른 엔드포인트가 생기면 여기에 추가)
api_router.include_router(users.router, prefix="/users", tags=["Users"])
# [추가] transactions 라우터 등록
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
# router 등록 부분에 추가
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

api_router.include_router(analysis.router, prefix="/analysis", tags=["analysis"])

api_router.include_router(points.router, prefix="/points", tags=["points"])