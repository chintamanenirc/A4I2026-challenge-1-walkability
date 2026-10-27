FROM python:3.11-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV GOOGLE_GENAI_USE_VERTEXAI=1
ENV GOOGLE_CLOUD_PROJECT=qwiklabs-gcp-04-ec3596addc43
ENV GOOGLE_CLOUD_LOCATION=us-central1
ENV PROJECT_ID=qwiklabs-gcp-04-ec3596addc43

COPY requirements.txt ./
RUN pip install --no-cache-dir google-adk google-cloud-bigquery requests uvicorn fastapi

COPY . /app/agents/atlanta_heat_agent/

EXPOSE 8000

CMD ["adk", "web", "--port=8000", "--host=0.0.0.0", "/app/agents/atlanta_heat_agent"]
