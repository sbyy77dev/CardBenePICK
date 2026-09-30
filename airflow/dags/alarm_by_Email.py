import os
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from airflow.decorators import dag, task
import pendulum
from airflow import DAG
from airflow.decorators import task
from pathlib import Path
from my_utils.repo import get_user_each_card_use_with_performance
from airflow.operators.python import PythonOperator


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
    dag_id='00_Alarm_by_gmail_taskflow',
    tags=["fisaai", 'my_dags', 'email', 'taskflow'],
    start_date=pendulum.datetime(2025, 1, 1, tz="Asia/Seoul"),
    schedule="0 9 * * *", 
    catchup=False,
)
def gmail_alarm_dag():

    @task
    def get_user_id():
        user_id = 1
        return user_id

    @task
    def send_email_via_api(user_id):
        """Gmail API를 사용하여 이메일을 작성하고 보냅니다."""
        try:
            service = gmail_authenticate()
            message = MIMEMultipart('related')
            message['Subject'] = '월간 카드 사용 실적 안내'
            message['From'] = 'noreply@gmail.com'
            message['To'] = '95potter95@gmail.com'

            # 이미지 저장 주소 지정
    
            IMAGE_BASE_PATH = Path('/opt/airflow/data')
            

            card_data_list = get_user_each_card_use_with_performance(user_id)
            cards_data = []
            for _ , row in card_data_list.iterrows():
                cards_data.append({"card_name": row['card_name'], "requirement": f"{row['performance']}원", "current_usage": f"{row['current_usage']}원", "image_filename": f"{row['card_id']}card.png"})

            # --- 2. HTML 테이블 생성 및 첨부할 이미지 정보 수집 ---

            table_rows = ""
            images_to_attach = []

            for i, card in enumerate(cards_data):
                # 각 이미지를 고유하게 식별할 Content-ID 생성
                cid = f"card_image_{i}"
                
                # HTML 테이블 행에 cid를 사용하여 이미지 태그 추가
                table_rows += f"""
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 12px; text-align: center;"><img src="cid:{cid}" alt="{card['card_name']}" style="max-width: 100px; height: auto;"></td>
                    <td style="padding: 12px; text-align: left; vertical-align: middle;">{card['card_name']}</td>
                    <td style="padding: 12px; text-align: right; vertical-align: middle;">{card['requirement']}</td>
                    <td style="padding: 12px; text-align: right; vertical-align: middle;">{card['current_usage']}</td>
                </tr>
                """
                
                # 첨부할 이미지의 전체 경로와 CID 정보를 리스트에 저장
                image_path = IMAGE_BASE_PATH / card['image_filename']
                images_to_attach.append({'path': image_path, 'cid': cid})

            # --- 3. 전체 HTML 구조를 생성하여 메시지에 첨부 ---

            html_body = f"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="font-family: Arial, sans-serif; color: #333;">
            <p>안녕하세요. 이번 달 카드 사용 실적을 안내해 드립니다.</p>
            <br>
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background-color: #f8f8f8;">
                    <tr>
                        <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: center;">카드 이미지</th>
                        <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left;">카드 이름</th>
                        <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">실적 기준</th>
                        <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">현재 사용액</th>
                    </tr>
                </thead>
                <tbody>{table_rows}</tbody>
            </table>
            </body>
            </html>
            """
            
            print(f"html_body \n {html_body}")
            message.attach(MIMEText(html_body, 'html'))

            # --- 4. 수집된 이미지들을 MIMEImage 객체로 만들어 메시지에 첨부 ---

            for img_info in images_to_attach:
                try:
                    with open(img_info['path'], 'rb') as f:
                        img_data = f.read()
                    
                    image_part = MIMEImage(img_data)
                    image_part.add_header('Content-ID', f"<{img_info['cid']}>")
                    message.attach(image_part)
                    
                except FileNotFoundError:
                    print(f"경고: {img_info['path']} 에서 이미지 파일을 찾을 수 없습니다. 첨부를 건너뜁니다.")

                    
            # base64로 인코딩된 이메일 메시지 생성
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            create_message = {'raw': encoded_message}
            
            # messages.send API 호출
            send_message = service.users().messages().send(userId="me", body=create_message).execute()
            print(f"메일이 성공적으로 발송되었습니다. Message ID: {send_message['id']}")

        except HttpError as error:
            print(f"에러가 발생했습니다: {error}")
            raise error
        
    user_id = get_user_id()
    send_email_via_api(user_id)

gmail_alarm_dag()