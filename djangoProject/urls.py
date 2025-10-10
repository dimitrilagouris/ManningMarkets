"""
URL configuration for djangoProject project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from .views.authentication_views import activate_user, get_csrf_token, get_user_data, initiate_login, logout_view, register_user, verify_otp
from .views.gmail_api_views import authorise_gmail, oauth2callback
from .views.market_views import fetch_markets
from .views.user_views import get_wallet, get_profile

urlpatterns = [
    path('admin/', admin.site.urls),

    # AUTHENTICATION RELATED URLS
    path('activate/<str:raw_token>', activate_user, name="activate"),
    path('get-csrf-token/', get_csrf_token, name="csrf-token"),
    path('login/', initiate_login, name="login"),
    path('verify-otp/', verify_otp, name="otp"),
    path('register/', register_user, name="register"),
    path('user/', get_user_data, name="user"),
    path('logout/', logout_view, name="logout"),

    # MARKET URLS
    path('fetch_markets/', fetch_markets, name="fetch markets"),

    # USER URLS
    path('wallet/', get_wallet, name="wallet"),
    path('profile/', get_profile, name="profile"),

    # GMAIL API URLS
    path('oauth2callback/', oauth2callback, name='oauth2callback'),
    path('authorise-gmail/', authorise_gmail, name='authorise-gmail'),
]
