import os
import json
import logging # FOR LATER

from django.http import HttpResponse
from django.shortcuts import redirect
from django.conf import settings
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CREDENTIALS_FILE = os.path.join(BASE_DIR, 'credentials.json')
TOKEN_FILE = os.path.join(BASE_DIR, 'token.json')
# Get backend URL from environment variable, defaulting to localhost:8000
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')
REDIRECT_URI = f'{BACKEND_URL}/oauth2callback/'
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def authorise_gmail(request):
    try:
        flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri = REDIRECT_URI,
        )
        auth_url, _ = flow.authorization_url(
            access_type = 'offline',
            include_granted_scopes='true',
            prompt = 'consent',
        )
        return redirect(auth_url)
    except Exception as error:
        return HttpResponse(f"Authorisation initiation failed {error}", status = 500)

def oauth2callback(request):
    code = request.GET.get('code')
    if not code:
        return HttpResponse("Authorisation Failed: no code provided", status=400)
    
    try: 
        flow = Flow.from_client_secrets_file(
        CREDENTIALS_FILE,
        scopes=SCOPES,
        redirect_uri = REDIRECT_URI
        )
        flow.fetch_token(code=code)
        creds=flow.credentials
        with open(TOKEN_FILE, 'w') as f:
            f.write(creds.to_json())
        return HttpResponse("Gmail Authorisation successful!", status=200)
    except Exception as error:
        return HttpResponse("Authorisation failed during token exchange", status = 500)