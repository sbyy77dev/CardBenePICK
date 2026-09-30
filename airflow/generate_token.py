import os
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# 1. API가 요청할 권한 범위
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

# 2. credentials.json 파일이 있는 정확한 경로
# credentials.json은 Google Cloud Console 에서 설정 및 저장 가능.
CREDENTIALS_PATH = './config/credentials.json'

# 3. 생성될 token.json 파일의 이름
TOKEN_PATH = 'token.json'

def main():
    """
    Google 인증을 통해 token.json 파일을 생성하는 메인 함수.
    """
    creds = None
    if os.path.exists(TOKEN_PATH):
        print(f"'{TOKEN_PATH}' 파일이 이미 존재합니다. 인증을 건너뜁니다.")
        return

    # 유효한 자격 증명이 없으면 사용자가 로그인하게 합니다.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            print("인증이 필요합니다. 웹 브라우저를 열어 인증을 진행해주세요...")
            try:
                flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
                creds = flow.run_local_server(port=0)
            except FileNotFoundError:
                print(f"오류: '{CREDENTIALS_PATH}' 파일을 찾을 수 없습니다.")
                print("credentials.json 파일이 이 스크립트와 같은 폴더에 있는지 확인해주세요.")
                return
            except Exception as e:
                print(f"인증 중 에러가 발생했습니다: {e}")
                return
        
        # 다음 실행을 위해 자격 증명을 파일로 저장합니다.
        with open(TOKEN_PATH, 'w') as token:
            token.write(creds.to_json())
        print(f"'{TOKEN_PATH}' 파일이 성공적으로 생성되었습니다!")

if __name__ == '__main__':
    main()
