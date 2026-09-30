from airflow.decorators import dag, task
import pendulum
from airflow import DAG
from airflow.decorators import task
from pathlib import Path
from my_utils.repo import get_user_each_card_use_with_performance, insert_val_notification, update_is_active_false, get_all_user_id_list
from airflow.operators.python import PythonOperator
import json

# API가 요청할 권한 범위. 메일 전송만 필요하므로 'gmail.send'만 사용.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
# Airflow 컨테이너 내에서 접근할 경로로 설정.
CREDENTIALS_PATH = '/opt/airflow/config/credentials.json'
TOKEN_PATH = '/opt/airflow/config/token.json'

@dag(
    dag_id='01_update_notifications_DB',
    tags=["fisaai", 'my_dags', 'noti', 'mysql', 'taskflow'],
    start_date=pendulum.datetime(2025, 1, 1, tz="Asia/Seoul"),
    schedule="0 9 * * *", 
    catchup=False,
)
def update_info_cardReport():

    @task
    def change_active_false():
        update_is_active_false()

    @task
    def get_user_id_list() -> list :
        uid_list = get_all_user_id_list()
        
        return uid_list


    @task
    def update_To_DB(user_list):
        """알림 DB를 최신화 합니다."""
        for user_id in user_list:
            try:
                
                card_data_list = get_user_each_card_use_with_performance(user_id)
                cards_data = []
                for _ , row in card_data_list.iterrows():
                    cards_data.append({"card_name": f"{row['card_name']}", "requirement": f"{row['performance']}", "current_usage": f"{row['current_usage']}", "image_filename": f"{row['card_id']}card.png"})
                json_string = json.dumps(cards_data, ensure_ascii=False)
                insert_val_notification(user_id, 1, json_string)
            except Exception as error:
                print(f"에러가 발생했습니다: {error}")
                raise error
        
    task1 = change_active_false()
    user_id = get_user_id_list()

    task1 >> user_id
    update_To_DB(user_id)

update_info_cardReport()