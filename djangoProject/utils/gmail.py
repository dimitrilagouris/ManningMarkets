# utils/gmail.py
import base64
import os
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from ..views.gmail_api_views import authorise_gmail

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_FILE = 'djangoProject/credentials.json'
TOKEN_FILE = 'djangoProject/views/token.json'

def get_gmail_service():
    creds = None

    # Load existing token
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    # Refresh if expired
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            with open(TOKEN_FILE, 'w') as token:
                token.write(creds.to_json())
        except Exception as e:
            raise RuntimeError(f"Token refresh failed: {e}")

    # Must have valid credentials at this point
    if not creds or not creds.valid:
        raise RuntimeError(
            "No valid credentials found. Please run /authorise_gmail/ first to authorize."
        )

    try:
        return build('gmail', 'v1', credentials=creds)
    except Exception as e:
        raise RuntimeError(f"Gmail service creation failed: {e}")

def send_email(to_email, subject, body):
    service = get_gmail_service()
    message = MIMEText(body)
    message['to'] = to_email
    message['from'] = "manningmarkets@gmail.com"
    message['subject'] = subject

    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    try:
        return service.users().messages().send(userId="me", body={'raw': raw}).execute()
    except Exception as e:
        print("Error sending email:", e)
        return None
