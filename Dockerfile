# Stage 1: Backend dev target (used by docker-compose)
FROM python:3.12-slim AS backend-dev

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY demo/ ./demo/

# Stage 2: Frontend build
FROM node:20-alpine AS frontend-build

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Stage 3: Production — FastAPI serves the React build
FROM python:3.12-slim AS production

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY demo/ ./demo/
COPY --from=frontend-build /frontend/dist ./frontend/dist

RUN mkdir -p /app/data

ENV DATABASE_PATH=/app/data/threat_dash.db
ENV DEMO_MODE=true

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
