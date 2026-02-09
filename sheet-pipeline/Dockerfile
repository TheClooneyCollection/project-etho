FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir requests openpyxl

COPY pipeline.py /app/pipeline.py

ENTRYPOINT ["python", "/app/pipeline.py"]
