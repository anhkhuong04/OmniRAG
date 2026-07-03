# Use official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Install system dependencies (required for some python packages like asyncpg)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the backend code into the container
COPY backend/ ./backend/

# Expose port 8000 for FastAPI
EXPOSE 8000

# Command to run the application (will be overridden by docker-compose if needed)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
