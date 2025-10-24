from django.template.loader import render_to_string
from django.conf import settings
from .gmail import send_email
from .tokens import create_email_token

def send_activation_email(user):
    raw_token = create_email_token(user)
    subject = "Activate your ManningMarkets account"
    frontend_path = getattr(settings, 'FRONTEND_PATH', 'http://localhost:3000') # REMOVE THE HARDCODE WHEN IN PROD
    activation_link = f"{frontend_path}/activate/{raw_token}"
    body = render_to_string('emails/activation_email.txt', {
        'username': user.username,
        'activation_link': activation_link
    })
    send_email(user.email, subject, body)

def send_otp_registration_email(user, otp):
    subject = "ManningMarkets OTP"
    body = render_to_string('emails/otp_email.txt', {
        'username': user.username,
        'otp': otp
    })
    send_email(user.email, subject, body)

def send_otp_email(user, event, price, quantity):
    subject = "ManningMarkets Trade Placed"
    body = render_to_string('emails/noticiation.txt', {
        'username': user.username,
        'event': event,
        'price': price,
        'quantity': quantity,
    })
    send_email(user.email, subject, body)