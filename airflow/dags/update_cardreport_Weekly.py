from airflow.decorators import dag, task
import pendulum
from airflow.decorators import task
from my_utils.repo import get_seven_days_usage, insert_val_notification, get_all_user_id_list
from airflow.operators.python import PythonOperator
import json

@dag(
    dag_id='02_update_notifications_DB_Weekly',
    tags=['notifications', 'weekly', 'mysql', 'taskflow'],
    start_date=pendulum.datetime(2025, 1, 1, tz="Asia/Seoul"),
    schedule="0 9 * * 1", # 월요일맏.
    catchup=False,
)
def update_info_cardReport_weekly():
    @task
    def get_section() -> str:
        from datetime import date, timedelta
        today = date.today()
        # 날짜 계산
        start_date = today - timedelta(days=7)
        end_date = today - timedelta(days=1)

        result_str = f"'{start_date.strftime('%m/%d')} ~ {end_date.strftime('%m/%d')}'"

        return result_str

    @task
    def get_user_id_list() -> list :
        uid_list = get_all_user_id_list()
        
        return uid_list


    @task
    def update_To_DB(user_list, date_interval):
        """알림 DB를 최신화 합니다."""
        for user_id in user_list:
            try:
                
                usage = get_seven_days_usage(user_id)
                info = {"title": "주간지출", "content": f"{date_interval}에 총 {usage}원을 썼어요. {'어디에 많이 썼는지 확인하세요' if usage != '0' else ''}"}
                json_string = json.dumps(info, ensure_ascii=False)
                insert_val_notification(user_id, 3, json_string)
            except Exception as error:
                print(f"에러가 발생했습니다: {error}")
                raise error
        
    date_interval = get_section()
    user_id = get_user_id_list()
    update_To_DB(user_id, date_interval)

update_info_cardReport_weekly()