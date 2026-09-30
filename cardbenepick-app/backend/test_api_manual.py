# 1. 실행 확인용 메시지 (이게 안 뜨면 실행조차 안 된 것)
print("▶ 테스트 스크립트를 시작합니다...")

import requests
import json
from datetime import datetime

# 2. 테스트할 API 주소 (백엔드 서버 주소)
API_URL = "http://localhost:8000/api/users/preferences"

# 3. 보낼 데이터 (프론트엔드에서 보내는 것과 똑같은 모양의 가짜 데이터)
payload = {
    "user_id": "test_user_123",           # 테스트용 유저 ID
    "cluster_id": 2,                      # 테스트용 군집 번호 (예: 에듀 맘/대디)
    "preferred_categories": ["CAFE", "ACADEMY"], # 테스트용 선호 카테고리
    "timestamp": datetime.now().isoformat() # 현재 시간
}

def run_test():
    print("-" * 50)
    print(f"🚀 [요청] 주소: {API_URL}")
    print(f"📦 [데이터] {json.dumps(payload, ensure_ascii=False)}")
    print("-" * 50)
    
    try:
        # 4. POST 요청 전송 (데이터 쏘기)
        response = requests.post(API_URL, json=payload)
        
        # 5. 결과 확인
        print(f"📡 [응답 코드] {response.status_code}")
        
        if response.status_code == 200:
            print("✅ [성공] 데이터 전송 완료!")
            print(f"📄 [서버 응답] {response.json()}")
        else:
            print("❌ [실패] 에러가 발생했습니다.")
            print(f"내용: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n⛔ [연결 실패] 백엔드 서버가 꺼져 있는 것 같습니다.")
        print("   -> 터미널에서 'uvicorn app.main:app --reload'를 실행해서 서버를 켜주세요.")
    except Exception as e:
        print(f"\n⚠️ [오류] {e}")

if __name__ == "__main__":
    run_test()