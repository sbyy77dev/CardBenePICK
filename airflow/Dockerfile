FROM apache/airflow:3.0.6

USER root
COPY requirements.txt /requirements.txt

USER airflow
# --force-reinstall 옵션을 추가하여 기존에 설치된 uvicorn을 무시하고 덮어씌웁니다.
RUN pip install --upgrade pip
RUN pip install --force-reinstall --no-cache-dir -r /requirements.txt
