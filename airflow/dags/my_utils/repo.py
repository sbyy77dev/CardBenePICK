from typing import Any, Dict, Iterable, Optional
import pandas as pd
from my_utils.db_mysql import get_conn
import json

def one_col(sql: str, params: Optional[Iterable[Any]] = None) -> list:
    print(f"ONE_COL SQL: {sql}")
    print(f"ONE_COL PARAMS: {params}")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        print(f"ONE_COL RAW ROWS: {rows}")
    print("row도 궁금하다", rows)
    result = [row[0] for row in rows]
    print(f"ONE_COL FINAL RESULT: {result}")

    return result

def df(sql: str, params: Optional[Iterable[Any]] = None) -> pd.DataFrame:
    print(f"EXECUTING SQL: {sql}")
    print(f"WITH PARAMS: {params}")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        # 컬럼명 가져오기
        columns = [desc[0] for desc in cur.description]
    print(f"QUERY RETURNED {len(rows)} rows")
    print(f"COLUMNS: {columns}")
    return pd.DataFrame(rows, columns=columns)

def execute_sql(sql: str, params: Optional[Iterable[Any]] = None):
    """ INSERT, DELETE 와 같은 return 값이 없는 sql문 실행"""
    try:
        with get_conn() as conn, conn.cursor() as cur:
            print(params)
            cur.execute(sql, params or ())

            conn.commit()
        return "성공"
    except:
        return "실패"
    
def one(sql: str, params: Optional[Iterable[Any]] = None) -> Optional[Dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params or ())
        row = cur.fetchone()
    return row

# --- 테이블별 헬퍼들 ---
def get_user_master(user_id: int):
    return one("SELECT user_id, uuid FROM user_master WHERE user_id=%s", (user_id,))


def get_user_assets(user_id: int, limit:int=20):
    return df("""
        SELECT * FROM user_assets
        WHERE user_id=%s ORDER BY updated_at DESC LIMIT %s
    """, (user_id, limit))

# mcc table 전체 정보
def get_mcc_map():
    return df("SELECT mcc_id, mcc_code, merchant_name FROM mcc")

# card id로 카드가 가지고 있는 혜택들 얻기
def get_card_benefit_by_card(card_id: int):
    return df("""
        SELECT BENEFIT_ID, card_id, category, summary, json_rawdata
        FROM card_benefit
        WHERE card_id=%s
        ORDER BY BENEFIT_ID
    """, (card_id))

def get_mcc_code_by_merchant(merchant : str) -> int:
    """
        DB에 있는 영업점 이름, 검색 이름의 공백을 없애서 검색
        만약 찾고자 하는 것이 없다면 None을 반환한다.
        사용법 :
        mcc_code = get_mcc_code_by_merchant('gs 25')
        
    """
    mcc_code = one("""
        SELECT mcc_code FROM mcc 
        WHERE REPLACE(merchant_name, ' ', '') = 
            REPLACE(%s, ' ', '');
    """, (merchant))
    if mcc_code :
        return mcc_code[0]
    return None
    

def get_total_cardbenefit_by_mcc(user_id : int, mcc : int) -> pd.DataFrame:
    """
        get_mcc_code_by_merchant 함수로 mcc를 구하여서 관련된 모든 혜택 내용을 검색한다.
    """
    user_cardlist = get_user_card_list(user_id)
    print("이거야",user_cardlist)
    
    # JSON_CONTAINS를 위해 '"1111"' 형식으로 변환
    mcc_json_param = f'"{str(mcc)}"'
    print(f"MCC JSON PARAM: {mcc_json_param}")
    
    benefit_df = df("""
        SELECT *
        FROM card_benefit
        WHERE JSON_CONTAINS(mcc_code, %s, '$') and card_id in %s;
    """, (mcc_json_param, user_cardlist))

    return benefit_df

def get_user_card_list(user_id : int) -> list:
    """
        user_id 를 사용해서 사용자가 가지고 있는 모든 카드 리스트를 얻습니다.
    """

    return tuple(one_col("""
            SELECT external_account_id
            FROM user_assets
            WHERE user_id = %s;
        """, (user_id,)))

def get_benefits_by_user_assets_and_mcc(user_id: int, mcc: int) -> pd.DataFrame:
    """
    user_assets에서 주어진 user_id의 external_card_id를 서브쿼리로 사용하여
    card_benefit와 card_master를 조인 후, 주어진 mcc가 포함된 혜택 행을 반환합니다.

    반환되는 컬럼: BENEFIT_ID, card_id, category, summary, json_rawdata, mcc_code, json_notice
    """
    # Use the exact SQL query form that works in MySQL Workbench
    # JSON_CONTAINS needs the second parameter as a JSON string literal like '"1111"'
    mcc_json_str = f'"{str(mcc)}"'  # converts 1111 to '"1111"'
    print(mcc_json_str)
    sql = f"""
        SELECT cm.card_name, cb.BENEFIT_ID, cb.card_id, cb.category, cb.summary, cb.json_rawdata, cb.mcc_code, cm.json_notice
        FROM card_benefit cb
        JOIN (
            SELECT DISTINCT external_account_id AS card_id
            FROM user_assets
            WHERE user_id = %s
        ) ua ON cb.card_id = ua.card_id
        JOIN card_master cm ON cb.card_id = cm.card_id
        WHERE JSON_CONTAINS(cb.mcc_code, %s, '$')
        ORDER BY cb.BENEFIT_ID
    """
    print("얘도호출하나2?")
    benefit_df = df(sql, (user_id, mcc_json_str))
    return benefit_df

def get_user_benefit_limit_in_benefit_sum(user_id: int) -> pd.DataFrame:
    """
    해당 user가 이번 기간에 적용받은 모든 혜택의 금액과 횟수를 조회해서 반환합니다.
    """
    print("얘도호출하나?")
    sql = """
    SELECT * FROM benefit_sum
    WHERE user_id = %s"""

    benefit_df = df(sql, (user_id,))
    return benefit_df

def get_user_each_card_use_with_performance(user_id: int) -> pd.DataFrame:
    """
    해당 user의 각 카드 사용 금액과 실적 달성 여부

    반환 colum : card_id, card_name, current_usage, previous_month_performance 
    """
    
    sql = """
    select A.card_id as card_id, card_name, COALESCE(B.current_usage, 0) as current_usage, previous_month_performance as performance
    from 
        (
            select card_id, card_name, previous_month_performance 
            from card_master
            where card_id in (select external_account_id from user_assets where user_id = %s)
        ) as A
        left join
        (
            select card_id, sum(amount_krw) as current_usage 
            from card_transactions 
            where user_id = %s and MONTH(transaction_date) = MONTH(NOW()) AND YEAR(transaction_date) = YEAR(NOW())
            group by (card_id)
        ) as B
        on A.card_id = B.card_id;
    """

    benefit_df = df(sql, (user_id, user_id,))
    return benefit_df

def get_seven_days_usage(user_id: int) -> pd.DataFrame:
    """
    해당 user의 지난 일주일 동안의 사용 금액 합산

    반환 값 : 합산 금액 : str
    """
    
    sql = """
        SELECT 
            IFNULL(SUM(amount_krw), 0) AS usage_7_days
        FROM card_transactions
        WHERE user_id = %s AND created_at >= CURDATE() - INTERVAL 7 DAY
        AND created_at <  CURDATE() ;
    """

    usage_val = one_col(sql, (user_id))
    return str(usage_val[0])

def insert_val_notification(user_id :int, alarm_cate :int, content : str):
    sql = """
        Insert into 
        notifications(user_id, alarm_type,content) 
        values (%s, %s, %s)
    """
    
    results = execute_sql(sql,(user_id, alarm_cate, content,))
    print("results", results)
    return results

def update_is_active_false():
    sql = """
        UPDATE notifications 
        SET is_active = false 
        WHERE is_active = true and alarm_type = 1;
    """
    
    results = execute_sql(sql)
    print("results", results)
    return results


def get_all_user_id_list():
    sql = """
        select distinct user_id 
        from user_master;
    """
    user_list = df(sql,)
    return list(user_list["user_id"])