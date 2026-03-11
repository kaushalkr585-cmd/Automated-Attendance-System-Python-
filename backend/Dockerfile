FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir --upgrade pip

# install precompiled dlib
RUN pip install --no-cache-dir dlib-bin

# copy requirements
COPY backend/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# copy backend code
COPY backend .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
