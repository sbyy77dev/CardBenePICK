import pandas as pd
import numpy as np
import json 
from sqlalchemy import create_engine
from tqdm import tqdm
import json
import glob
import os
from datetime import datetime
from my_utils.db_mysql import MYSQL_SERVER,MYSQL_DB,MYSQL_USER,MYSQL_PASSWORD

def upload_main():
    # 오늘 날짜 가져오기
    today = datetime.now()

    # YYYYMMDD 형식으로 포맷팅
    formatted_date = today.strftime("%Y%m%d")
    target_folder_path = r'/opt/airflow/dags/my_utils/data/crawling_data'
    # target_folder_path = r'C:/ITStudy/Project/Final/airflow/dags/my_utils/data/crawling_data'

    folder_path = os.path.join(target_folder_path, formatted_date)

    json_files = glob.glob(os.path.join(folder_path, '*.json'))
    print(f"발견된 파일 개수: {len(json_files)}개")

    data = []
    for file_path in json_files:
        with open(file_path, 'r', encoding='utf-8') as f:
            file_data = json.load(f)
            if isinstance(file_data, list):
                data.extend(file_data)
            else:
                data.append(file_data)
    
    print(f"총 합산 카드 개수: {len(data)}")

    def extract_notice_subtitles(card: dict):
        for b in card.get('benefits', []):
            if b.get('category') == '유의사항':
                return b.get('subtitles', [])
        return [] 

    # 4. card_master 가공
    card_master_df = pd.DataFrame([
        {
            'card_id': card.get('card_id'),
            'card_name': card.get('card_name'),
            'card_company': card.get('card_company'),
            'card_rank': card.get('card_rank', None),
            'card_type': 0,
            'domestic_year_cost': card.get('domestic_year_cost', 0),
            'abroad_year_cost': card.get('abroad_year_cost', 0),
            'previous_month_performance': card.get('previous_month_performance', 0),
            'json_notice': json.dumps(extract_notice_subtitles(card), ensure_ascii=False)
        }
        for card in data
    ])

    # 5. card_benefit 가공
    benefit_rows = []
    for card in data:
        benefits = card.get('benefits', [])
        for idx, b in enumerate(benefits):
            benefit_rows.append({
                'benefit_id': f"{card.get('card_id')}_{idx}",
                'card_id': card.get('card_id'),
                'category': b.get('category', '기타'),
                'summary': b.get('summary', ''),
                'json_rawdata': json.dumps(b["subtitles"], ensure_ascii=False),
                'mcc_code': json.dumps(b.get('mcc', []), ensure_ascii=False)
            })

    card_benefit_df = pd.DataFrame(benefit_rows)

    def clean_df(df):
        # pymysql에서 None은 NULL로 변환됩니다.
        df = df.replace({np.nan: None})
        return df

    card_master_df = clean_df(card_master_df)
    card_benefit_df = clean_df(card_benefit_df)

    # DB 연결 설정
    db_config_A = {
        'host': MYSQL_SERVER,
        'port': 3306,
        'user': MYSQL_USER,
        'password': MYSQL_PASSWORD,
        'database': MYSQL_DB
    }

    # 엔진 생성
    engine_A = create_engine(
        f"mysql+pymysql://{db_config_A['user']}:{db_config_A['password']}@{db_config_A['host']}:{db_config_A['port']}/{db_config_A['database']}"
    )

    # [핵심 수정] to_sql 대신 raw connection을 이용한 직접 INSERT
    # 이 방식은 Pandas/SQLAlchemy 버전을 타지 않습니다.
    raw_conn = engine_A.raw_connection()
    cursor = raw_conn.cursor()
    
    chunksize = 3000
    schema_name = "team5_1113"

    try:
        for name, df in {
            'card_master_temp': card_master_df,
            'card_benefit_temp': card_benefit_df,
        }.items():
            if df.empty:
                continue
                
            print(f"\n⏳ Inserting {name} ({len(df)} rows)...")
            
            # INSERT 쿼리 생성
            # 예: INSERT INTO team5_1113.table_name (`col1`, `col2`) VALUES (%s, %s)
            columns = df.columns.tolist()
            cols_str = ",".join([f"`{c}`" for c in columns])
            placeholders = ",".join(["%s"] * len(columns))
            table_full_name = f"{schema_name}.{name}"
            
            sql = f"INSERT INTO {table_full_name} ({cols_str}) VALUES ({placeholders})"
            
            # 데이터 준비 (numpy 타입을 python 기본 타입으로 변환이 안전함)
            data_values = df.values.tolist()
            
            # 청크 단위 실행
            for i in tqdm(range(0, len(data_values), chunksize)):
                batch = data_values[i:i+chunksize]
                cursor.executemany(sql, batch)
                raw_conn.commit()  # 배치마다 커밋 (선택사항)
                
            print(f"✅ {name} insert complete.")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        raw_conn.rollback()
        raise e
    finally:
        cursor.close()
        raw_conn.close()

    print("\n🎉 모든 테이블 데이터 삽입 완료!")