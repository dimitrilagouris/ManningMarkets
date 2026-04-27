# Manning Markets

## Prerequisites

- Python 3.x
- Node.js & npm
- Homebrew (macOS)
- Redis
*Docker *(if running via containers)*


### Install Redis
```bash
brew install redis
```

---

## Environment Files

The project will not run without the following environment variables set.

### Backend — `djangoProject/.env`
```bash
DEBUG=True
SECRET_KEY=django-insecure-local-dev-key-change-in-production
ALLOWED_HOSTS=127.0.0.1,localhost
REDIS_URL=redis://localhost:6379/0

CORS_ALLOWED_ORIGINS=http://localhost:3000
CSRF_TRUSTED_ORIGINS=http://localhost:3000

CSRF_COOKIE_SECURE=False
CSRF_COOKIE_SAMESITE=Lax
CSRF_COOKIE_HTTPONLY=False
CSRF_COOKIE_DOMAIN=

SESSION_COOKIE_SECURE=False
SESSION_COOKIE_SAMESITE=Lax

FRONTEND_PATH=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

### Frontend — `frontend/.env`
```bash
REACT_APP_DJANGO_API_BASE=http://localhost:8000
REACT_APP_WS_BASE_URL=ws://localhost:8000
```

---

## Building Locally

### 1. Backend
```bash
python3 -m venv env
source env/bin/activate

cd djangoProject
./start_backend.sh
```
This will automatically start Redis, install dependencies, run migrations, and start Daphne.

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

The app will be available at `http://localhost:3000`.

---

## Building via Docker

Docker handles the environment setup, including the database, Redis, and dependencies.

### 1. Free up your local ports
If you have a local instance of Redis running, you must shut it down to prevent port conflicts (port 6379) with the Docker container:

```bash
brew services stop redis
# OR
redis-cli shutdown
```

### 2. Build and start the containers
From the root directory of the project, run:

```bash
docker compose up --build
```

The app will be available at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`



## Stopping the Project

```bash
pkill -f "daphne"
redis-cli shutdown
```



# Authentication

The app's authentication behaviour can be modified within `djangoProject/settings.py`

### Two-Factor Authentication (2FA)
The platform supports 2FA for enhanced security. This is controlled by the following flag:

```python
TWO_FACTOR_ENABLED = False
```

If you choose to enable 2FA by setting this to True:

1. Ensure you have your credentials.json file placed in the backend root directory. 
2. Upon the first login attempt, the system will prompt for authorisation to generate your local token.json.

### Configuration Gmail Oauth2

The backend requires access to the Gmail API to send system emails. If you encounter issues with email delivery or token expiration:

1. **Clear Existing Tokens**: If the token.json is expired or corrupted, delete it from the backend directory.

2. **Authorise via Browser**: Navigate to http://localhost:3000/authorise-gmail/.

3. **Sign In:** Follow the prompts to sign into the Gmail account associated with the platform.

4. **Verification:** A message stating "Gmail Authorisation successful!" confirms the backend can now send emails on your behalf.

## Sample Markets

If you need to populate the platform with example markets to play around with, run the `seed_markets.py` script:

**⚠️ Warning:** This script will delete all existing `Markets`, `Events`, `Orders`, `Trades`, and `Positions` to ensure a clean slate before inserting the new catalogue of USYD and tech-themed prediction markets.

### Running Locally
Ensure your virtual environment is active, then run the script directly from your backend directory:

```bash
cd djangoProject
source env/bin/activate
python scripts/init_db_defaults.py
```

### Running via Docker
Whilst the containers are actively running, open a new terminal window and execute the script inside the backend container:

```bash
docker compose exec backend python scripts/init_db_defaults.py
```

You should see a confirmation message: `Successfully seeded 12 markets and events.`
