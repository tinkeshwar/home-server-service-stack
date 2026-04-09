FROM python:3.11-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
COPY . .

# Added --system flag here
RUN uv pip install --system fastapi uvicorn jinja2 python-multipart mempalace

EXPOSE 8000
# We use the system python to run uvicorn
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]