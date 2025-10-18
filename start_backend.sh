#!/bin/bash

echo "Starting Django Backend with WebSocket support..."

# Install required packages from requirements.txt
python3 -m pip install -r requirements.txt

# Run migrations
python3 manage.py migrate


# python3 manage.py runserver was deprecated
#   - Django runserver uses WSGI, which is synchronous and doesn't support websockets.
#   - Use Daphne to serve the application with ASGI for WebSocket support.
daphne -b 0.0.0.0 -p 8000 djangoProject.asgi:application
