from elasticsearch import Elasticsearch, helpers
import json

def embedding_vectorDB():
    if False : # 한 번 실행되면, 많은 비용이 발생하기 때문에 사용하지 않을 때에는 임의로 사용되지 않도록 막아둡니다.
        # 연결 설정
        es = Elasticsearch("http://localhost:9200")
        index_name = "credit_cards_nested_v1"

        # 데이터 추출 (Scan 방식 사용하여 대용량도 안전)
        data = [doc for doc in helpers.scan(es, index=index_name, query={"query": {"match_all": {}}})]

        # 파일 저장
        with open("credit_cards_backup.json", "w", encoding="utf-8") as f:
            for doc in data:
                f.write(json.dumps(doc) + "\n")

        print("완료")