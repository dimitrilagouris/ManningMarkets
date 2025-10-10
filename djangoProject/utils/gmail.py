# utils/gmail.py
import base64
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_FILE = 'djangoProject/credentials.json'
TOKEN_FILE = 'djangoProject/token.json'

def get_gmail_service():
    try:
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return build('gmail', 'v1', credentials=creds)
    except Exception as e:
        raise RuntimeError(f"Gmail authentication failed: {e}")

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
