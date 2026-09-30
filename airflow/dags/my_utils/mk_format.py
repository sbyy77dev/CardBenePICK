import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from pathlib import Path
from my_utils.repo import get_user_each_card_use_with_performance

# --- 1. 기본 설정 및 데이터 ---
def make_mail_format(card_ids):
    # 'related' 타입의 MIMEMultipart 객체는 HTML 본문과 이미지를 함께 묶어줍니다.
    message = MIMEMultipart('related')
    message['Subject'] = '월간 카드 사용 실적 안내'
    message['From'] = 'noreply@yourcompany.com'
    message['To'] = '95potter95@gmail.com'

    # !! 중요 !!
    # 이미지가 저장된 실제 경로를 지정해야 합니다.
    # 이 예제에서는 Airflow DAGs 폴더 내의 'images' 디렉토리를 가정합니다.

    IMAGE_BASE_PATH = Path('/opt/airflow/data')
    

    card_data_list = get_user_each_card_use_with_performance(1)
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

    return message

if __name__ == "__main__":

    a = make_mail_format(1)