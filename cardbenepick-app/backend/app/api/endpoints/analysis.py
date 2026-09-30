# import os
# from typing import List, Any
# from fastapi import APIRouter, Depends
# from sqlalchemy import func, extract
# from sqlmodel import Session, select
# from datetime import datetime, timedelta

# from app.api import deps
# from app.core.security import get_current_user_payload
# from app.db.models import CardTransaction, UserAsset
# import app.core.config as config

# router = APIRouter()

# # --------------------------------------------------------------------
# # [설정] 프론트엔드 이미지 폴더 위치 찾기
# # 백엔드 파일(backend/app/api/endpoints/analysis.py) 위치 기준으로
# # ../../../../../frontend/public/images 경로를 계산합니다.
# # --------------------------------------------------------------------
# CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# # 로컬 환경에 맞게 경로 조정 (User의 프로젝트 구조 기반)
# FRONTEND_IMG_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../../../../frontend/public/images"))

# def find_smart_image_filename(card_id: str) -> str:
#     """
#     카드 ID(예: '2807')를 받아서, 
#     폴더 내에 '2807card'로 시작하는 파일(예: '2807card-(1).png')을 찾아 반환
#     """
#     search_prefix = f"{card_id}card"
    
#     try:
#         if os.path.exists(FRONTEND_IMG_DIR):
#             files = os.listdir(FRONTEND_IMG_DIR)
#             for filename in files:
#                 # [핵심] 파일명이 '2807card'로 시작하고 이미지 파일이면 당첨!
#                 if filename.startswith(search_prefix) and (filename.lower().endswith(".png") or filename.lower().endswith(".jpg")):
#                     return filename
#     except Exception as e:
#         print(f"이미지 검색 중 에러 발생: {e}")
    
#     # 못 찾으면 기본 규칙대로 반환 (혹은 default_card.png)
#     return f"{card_id}card.png"

# @router.get("/realtime-cards")
# def get_realtime_card_performance(
#     db: Session = Depends(deps.get_db),
#     payload: dict = Depends(get_current_user_payload)
# ):
#     user_id = payload.get("user_id")
    
#     # 1. 내 자산(UserAsset) 가져오기
#     my_cards = db.exec(
#         select(UserAsset)
#         .where(UserAsset.user_id == user_id)
#         .where(UserAsset.asset_type == "card")
#     ).all()

#     results = []
    
#     # --- 날짜 계산 ---
#     now = datetime.now()
#     # 이번 달 1일 (예: 11월 1일)
#     start_of_curr_month = datetime(now.year, now.month, 1)
#     # 지난 달 말일 (예: 10월 31일)
#     last_day_of_prev_month = start_of_curr_month - timedelta(days=1)
#     # 지난 달 1일 (예: 10월 1일)
#     start_of_prev_month = datetime(last_day_of_prev_month.year, last_day_of_prev_month.month, 1)

#     for asset in my_cards:
#         # 2. [이번 달] 실시간 금액 합산
#         this_month_sum = db.exec(
#             select(func.sum(CardTransaction.amount_krw))
#             .where(CardTransaction.user_id == user_id)
#             .where(CardTransaction.card_company == asset.institution_name)
#             .where(CardTransaction.transaction_date >= start_of_curr_month)
#         ).one()
#         current_usage = this_month_sum if this_month_sum else 0

#         # 3. [지난 달] 실적 합계 (비교용)
#         last_month_sum = db.exec(
#             select(func.sum(CardTransaction.amount_krw))
#             .where(CardTransaction.user_id == user_id)
#             .where(CardTransaction.card_company == asset.institution_name)
#             .where(CardTransaction.transaction_date >= start_of_prev_month)
#             .where(CardTransaction.transaction_date < start_of_curr_month)
#         ).one()
#         last_month_usage = last_month_sum if last_month_sum else 0

#         # 4. [핵심] 스마트 이미지 찾기 함수 호출!
#         # ID가 '2807'이면 -> 폴더를 뒤져서 '2807card-(1).png'를 찾아옴
#         card_id = asset.external_account_id
#         img_name = find_smart_image_filename(card_id)
#         full_image_url = f"{config.IMAGE_BASE_URL}/{img_name}"

#         results.append({
#             "card_name": asset.institution_name,
#             "card_number": card_id,
#             "current_usage": current_usage,      # 이번 달
#             "last_month_usage": last_month_usage, # 지난 달
#             "requirement": 300000,
#             "image_filename": img_name 
#         })
    
#     # 많이 쓴 순서 정렬
#     results.sort(key=lambda x: x["current_usage"], reverse=True)
    
#     return results

# # calendar
# @router.get("/calendar")
# def get_calendar_transactions(
#     year: int,
#     month: int,
#     db: Session = Depends(deps.get_db),
#     payload: dict = Depends(get_current_user_payload)
# ):
#     """
#     특정 연도/월의 거래 내역을 반환합니다.
#     """
#     user_id = payload.get("user_id")
    
#     transactions = db.exec(
#         select(CardTransaction)
#         .where(CardTransaction.user_id == user_id)
#         .where(extract('year', CardTransaction.transaction_date) == year)
#         .where(extract('month', CardTransaction.transaction_date) == month)
#         .order_by(CardTransaction.transaction_date.desc())
#     ).all()
    
#     return transactions

import os
from typing import List, Any
from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlmodel import Session, select
from datetime import datetime, timedelta

from app.api import deps
from app.core.security import get_current_user_payload
from app.db.models import CardTransaction, UserAsset, CardMaster
import app.core.config as config 

router = APIRouter()

# --------------------------------------------------------------------
# [설정] 프론트엔드 이미지 폴더 위치 찾기
# --------------------------------------------------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_IMG_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../../../../frontend/public/images"))

def find_smart_image_filename(card_id: str) -> str:
    """
    카드 ID로 이미지 파일 찾기 (확장자 자동 감지)
    """
    search_prefix = f"{card_id}card"
    try:
        if os.path.exists(FRONTEND_IMG_DIR):
            files = os.listdir(FRONTEND_IMG_DIR)
            for filename in files:
                if filename.startswith(search_prefix) and (filename.lower().endswith(".png") or filename.lower().endswith(".jpg")):
                    return filename
    except Exception as e:
        print(f"이미지 검색 중 에러: {e}")
    
    return f"{card_id}card.png"

@router.get("/realtime-cards")
def get_realtime_card_performance(
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    """
    이번 달 카드 실적 현황 조회 (이미지 파일명 반환)
    """
    user_id = payload.get("user_id")
    
    my_cards = db.exec(
        select(UserAsset)
        .where(UserAsset.user_id == user_id)
        .where(UserAsset.asset_type == "card")
    ).all()

    results = []
    
    now = datetime.now()
    start_of_curr_month = datetime(now.year, now.month, 1)
    last_day_of_prev_month = start_of_curr_month - timedelta(days=1)
    start_of_prev_month = datetime(last_day_of_prev_month.year, last_day_of_prev_month.month, 1)

    for asset in my_cards:
        card_id = asset.external_account_id

        # 목표 실적 조회
        card_master = db.exec(
            select(CardMaster).where(CardMaster.card_id == card_id)
        ).first()
        
        real_requirement = 300000
        if card_master and card_master.previous_month_performance is not None:
            real_requirement = card_master.previous_month_performance

        # 실적 계산
        this_month_sum = db.exec(
            select(func.sum(CardTransaction.amount_krw))
            .where(CardTransaction.user_id == user_id)
            .where(CardTransaction.card_company == asset.institution_name)
            .where(CardTransaction.transaction_date >= start_of_curr_month)
        ).one()
        current_usage = this_month_sum if this_month_sum else 0

        last_month_sum = db.exec(
            select(func.sum(CardTransaction.amount_krw))
            .where(CardTransaction.user_id == user_id)
            .where(CardTransaction.card_company == asset.institution_name)
            .where(CardTransaction.transaction_date >= start_of_prev_month)
            .where(CardTransaction.transaction_date < start_of_curr_month)
        ).one()
        last_month_usage = last_month_sum if last_month_sum else 0

        # [수정] URL 대신 파일명만 찾아서 보냄
        img_name = find_smart_image_filename(card_id)

        results.append({
            "card_id": card_id, 
            "card_name": asset.external_account_name or asset.institution_name,
            "card_company": asset.institution_name,
            "current_usage": int(current_usage),
            "last_month_usage": int(last_month_usage),
            "requirement": int(real_requirement),
            "image_filename": img_name 
        })
    
    results.sort(key=lambda x: x["current_usage"], reverse=True)
    return results

@router.get("/calendar")
def get_calendar_transactions(
    year: int,
    month: int,
    db: Session = Depends(deps.get_db),
    payload: dict = Depends(get_current_user_payload)
):
    user_id = payload.get("user_id")
    transactions = db.exec(
        select(CardTransaction)
        .where(CardTransaction.user_id == user_id)
        .where(extract('year', CardTransaction.transaction_date) == year)
        .where(extract('month', CardTransaction.transaction_date) == month)
        .order_by(CardTransaction.transaction_date.desc())
    ).all()
    return transactions