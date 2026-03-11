# ── Stage: pre-install binary dlib, then everything else ──────────────────────
FROM python:3.10-slim

WORKDIR /app

# System libs needed by opencv-headless and face_recognition at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

# 1️⃣  Install pre-compiled dlib binary FIRST.
#     When face_recognition installs next, pip sees dlib is already satisfied
#     and skips the 8 GB source compilation entirely.
RUN pip install --no-cache-dir dlib-bin

# 2️⃣  Install the rest of the requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3️⃣  Copy application code
COPY . .

EXPOSE 8000

CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
