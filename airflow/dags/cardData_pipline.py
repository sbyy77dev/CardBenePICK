from airflow.decorators import dag, task
import pendulum
import asyncio
from airflow.decorators import task
from my_utils.optimized_crawling_crawling import crawling_main
from my_utils.upload_sql_aftercrawling import upload_main
from my_utils.summary import process_card_summaries, check_null_val_count
from my_utils.elk import embedding_vectorDB
from airflow.operators.python import PythonOperator
from datetime import datetime
import json

import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import pendulum

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage

import base64
from googleapiclient.errors import HttpError

# API가 요청할 권한 범위. 메일 전송만 필요하므로 'gmail.send'만 사용.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']
# Airflow 컨테이너 내에서 접근할 경로로 설정.
CREDENTIALS_PATH = '/opt/airflow/config/credentials.json'
TOKEN_PATH = '/opt/airflow/config/token.json'

def gmail_authenticate():
    """Google 인증을 처리하고 API 서비스 객체를 반환합니다."""
    creds = None

    # 인증 흐름이 처음 완료될 때 자동으로 생성
    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    
    # 유효한 자격 증명이 없으면 사용자가 로그인
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # 이 부분은 Airflow 에서 실행하기 어렵기 때문에 generate_token.py를 사용해서 token.json을 저장한다.
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)
        
        # 다음 실행을 위해 자격 증명을 저장
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
            
    return build( 'gmail', 'v1', credentials=creds)


@dag(
    dag_id='03_crawling_cardData_pipline',
    tags=['crawling', 'cardData', 'cardGorila', 'taskflow'],
    start_date=pendulum.datetime(2025, 1, 1, tz="Asia/Seoul"),
    schedule="0 1 * * *", # 매 새벽 1시에 진행하도록
    catchup=False,
)
def getData_pipeline_weekly():
    @task
    def get_cardData():
        crawling_main()

    @task
    def upload_cardData():
        upload_main()

    @task
    def summarized_cardmaster_temp():
        asyncio.run(process_card_summaries())
    
    @task
    def alert_mail():
        """Gmail API를 사용하여 이메일을 작성하고 보냅니다."""
        try:
            service = gmail_authenticate()
            message = MIMEMultipart('related')
            message['Subject'] = '월간 카드 사용 실적 안내'
            message['From'] = 'noreply@gmail.com'
            message['To'] = '95potter95@gmail.com'

            email_body = f"""
                <html>
                <body>
                    <h2 style="color: #d9534f;">⚠️ 데이터 유효성 검사 실패 알림</h2>
                    <p>크롤링 데이터가 설정된 유효성 기준(Validation Rules)을 충족하지 못했습니다.</p>
                    
                    <h3>1. 요약 (Summary)</h3>
                    <ul>
                        <li><b>파이프라인:</b> cardData_pipeline </li>
                        <li><b>실행 시간:</b> {datetime.now()}</li>
                    </ul>
                    
                    <hr>
                    <p style="font-size: 12px; color: grey;">
                        * 이 메일은 자동 발송되었습니다. 자세한 내용은 <a href="http://airflow-server/...">Airflow 로그</a>를 확인하세요.
                    </p>
                </body>
                </html>
                """
            
            print(f"html_body \n {email_body}")
            message.attach(MIMEText(email_body, 'html'))

                    
            # base64로 인코딩된 이메일 메시지 생성
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {'raw': encoded_message}
            
            # messages.send API 호출
            send_message = service.users().messages().send(userId="me", body=create_message).execute()
            print(f"메일이 성공적으로 발송되었습니다. Message ID: {send_message['id']}")

        except HttpError as error:
            print(f"에러가 발생했습니다: {error}")
            raise error
        return "Send Email"
    
    @task.branch
    def data_validation():
        total_count = check_null_val_count()
        print(total_count)
        if total_count  > 0 :
            return "summarized_cardmaster_temp"
        else :
            return "alert_mail"
        
    @task
    def update_vectorDB_index():
        """
        적재된 데이터에 따라서 vectorDB (엘라스틱서치)로 임베딩하는 기능
        """

        embedding_vectorDB()
    
    crwaling = get_cardData()
    upload = upload_cardData()
    validation = data_validation()
    # summary = summarized_cardmaster_temp()

    summary_job = summarized_cardmaster_temp()
    mail_job = alert_mail()

    update_vectorDB = update_vectorDB_index()
    crwaling >> upload >> validation
    validation >> [summary_job, mail_job]
    summary_job >> update_vectorDB

getData_pipeline_weekly()