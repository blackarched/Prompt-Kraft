FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create config and data directories
RUN mkdir -p /app/config /app/data

# Set environment variables
ENV PROMPTCRAFT_ENV=production
ENV PROMPTCRAFT_CONFIG_DIR=/app/config
ENV PROMPTCRAFT_DB_PATH=/app/data/analytics.db
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the API server
CMD ["python", "api_server.py"]