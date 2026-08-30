# Multi-stage Dockerfile for Saransh AI News API
# syntax=docker/dockerfile:1

FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt

# ── Development (hot reload via volume mounts) ────────────────────────────────
FROM base AS development

ENV APP_ENV=development \
    DEBUG=True

COPY app/ ./app/
COPY main.py .
COPY scripts/ ./scripts/

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# ── Production ────────────────────────────────────────────────────────────────
FROM base AS production

ENV APP_ENV=production \
    DEBUG=False

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY app/ ./app/
COPY main.py .
COPY scripts/ ./scripts/

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

CMD exec gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8001} --workers 1 --threads 8 --timeout 0
