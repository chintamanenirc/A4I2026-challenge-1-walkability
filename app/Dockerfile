# Planner app image (heat-planner-app): the ADK agent plus the planner UI.
# Separate from the root Dockerfile, which stays the agent lane's `adk api_server` image.
# Build from the repo root: docker build -f app/Dockerfile .  (or app/cloudbuild.yaml)
FROM python:3.11-slim
WORKDIR /app

RUN adduser --disabled-password --gecos "" myuser

# Dependencies first, so code edits don't re-install them
COPY agent/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Agent package (ADK app name = folder name) and the planner web app
COPY --chown=myuser:myuser agent/ /app/agents/urban_heat_agent/
COPY --chown=myuser:myuser app/ /app/app/

USER myuser

ENV GOOGLE_GENAI_USE_VERTEXAI=1 \
    GOOGLE_CLOUD_LOCATION=us-central1 \
    AGENTS_DIR=/app/agents \
    APP_NAME=urban_heat_agent \
    CITY_NAME=Atlanta \
    PORT=8080

EXPOSE 8080
# Planner UI at /planner/, agent API at /run_sse, ADK dev UI at /dev-ui/
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
