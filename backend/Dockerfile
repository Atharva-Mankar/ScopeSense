FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
COPY alembic.ini .

RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir .

COPY src/ ./src/

EXPOSE 8000

CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]