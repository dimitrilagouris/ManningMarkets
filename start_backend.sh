#!/bin/bash

echo "Starting Django backend with WebSocket support..."

# Start Redis if not already running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
else
    echo "Redis already running."
fi

# Ensure a virtual environment exists to prevent PEP-668 system conflicts
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating one now..."
    python3 -m venv venv
fi

source venv/bin/activate

python3 -m pip install -r requirements.txt
python3 manage.py migrate
daphne -b 0.0.0.0 -p 8000 djangoProject.asgi:application