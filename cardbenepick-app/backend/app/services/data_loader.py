# backend/app/services/data_loader.py

import os
import csv
import uuid
from datetime import datetime
from typing import List
from fastapi import HTTPException, status
from sqlmodel import Session, select
from app.db.models import CardMaster, CardTransaction, UserAsset, AssetType

# 프론트엔드 ID (key) <-> DB 저장값 (value) 매핑
COMPANY_MAPPING = {
    "shinhan": "신한카드",
    "samsung": "삼성카드",
    "bc_baro": "BC 바로카드",
    "ibk": "IBK기업은행",
    "kb": "KB국민카드",
    "mg": "MG새마을금고",
    "nh": "NH농협카드",
    "lotte": "롯데카드",
    "woori": "우리카드",
    "hana": "하나카드",
    "hyundai": "현대카드",
}

def load_mock_data(db: Session, user_id: int, selected_companies: List[str]):
    """
    Mock CSV 데이터를 읽어와서 필터링 후 DB에 적재합니다.
    """
    # 1. Mock 데이터 파일 경로 확인
    # (상대 경로 문제 방지를 위해 절대 경로 계산 권장)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # app/
    file_path = os.path.join(base_dir, "mock_data", str(user_id), "transactions.csv")

    # [예외 처리] 파일이 없으면 404 에러 발생 -> 프론트엔드에서 toast로 표시됨
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="해당 사용자의 마이데이터(거래내역) 파일이 존재하지 않습니다."
        )

    # 2. 선택한 카드사의 한글 이름 리스트 변환
    target_companies = []
    for code in selected_companies:
        if code in COMPANY_MAPPING:
            target_companies.append(COMPANY_MAPPING[code])
    
    # 3. CSV 파일 읽기 및 처리
    try:
        with open(file_path, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            
            # DB 조회 최적화를 위해 이미 조회한 카드 정보는 캐싱
            card_info_cache = {}
            
            new_transactions_count = 0

            for row in reader:
                card_id = row["card_id"]
                
                # (1) 카드 마스터 정보 조회 (캐싱 활용)
                if card_id not in card_info_cache:
                    card_master = db.exec(
                        select(CardMaster).where(CardMaster.card_id == card_id)
                    ).first()
                    
                    if not card_master:
                        continue # 마스터에 없는 카드는 스킵
                    
                    card_info_cache[card_id] = card_master

                current_card = card_info_cache[card_id]
                
                # (2) 사용자가 선택한 카드사인지 필터링
                if current_card.card_company not in target_companies:
                    continue

                # (3) UserAsset(자산) 등록 여부 확인 및 생성
                # (이미 등록된 카드는 중복 등록 방지)
                existing_asset = db.exec(
                    select(UserAsset)
                    .where(UserAsset.user_id == user_id)
                    .where(UserAsset.external_account_id == card_id)
                ).first()

                if not existing_asset:
                    new_asset = UserAsset(
                        user_id=user_id,
                        asset_type=AssetType.card,
                        institution_name=current_card.card_company,
                        external_account_id=card_id,
                        external_account_name=current_card.card_name,
                        balance=0 # 신용카드는 잔액 의미가 모호하므로 0
                    )
                    db.add(new_asset)
                    # flush를 해야 asset_id가 생성됨 (필요하다면)
                    db.flush() 

                # (4) CardTransaction(거래내역) 적재
                # 중복 적재 방지 (transaction_date와 card_id 등으로 체크 가능하나, 
                # 여기서는 단순화를 위해 무조건 적재하거나, 기 생성된 UUID 로직을 따름)
                
                # transaction_date 파싱 (CSV: '2025-09-01 16:37:10')
                t_date = datetime.strptime(row["transaction_datetime"], "%Y-%m-%d %H:%M:%S")
                
                new_tx = CardTransaction(
                    transaction_id=str(uuid.uuid4()), # 고유 ID 생성
                    user_id=user_id,
                    card_id=card_id,
                    card_company=current_card.card_company,
                    transaction_date=t_date,
                    merchant_name=row["merchant"],
                    amount_krw=int(row["amount_krw"]),
                    installment_months=0
                )
                db.add(new_tx)
                new_transactions_count += 1
            
            # 모든 작업이 끝나면 커밋
            db.commit()
            
            return {
                "message": "Data loaded successfully", 
                "count": new_transactions_count,
                "companies": target_companies
            }

    except Exception as e:
        db.rollback()
        # CSV 포맷 에러 등 예상치 못한 에러 처리
        print(f"Error loading data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"데이터 처리 중 오류가 발생했습니다: {str(e)}"
        )