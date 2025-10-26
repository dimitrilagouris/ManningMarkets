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

from .views.market_views import fetch_markets, fetch_leaderboard, fetch_market
from .views.user_views import get_wallet, get_profile, change_username, change_password
from .views.order_view import create_order, get_orderbook
from .views.wallet_views import get_user_trades, get_user_orders, get_user_positions, cancel_order
from .views import admin_views


urlpatterns = [
    #ADMIN URLS
    path('api/admin/users/', admin_views.get_all_users, name='admin_get_users'),
    path('api/admin/users/<int:user_id>/', admin_views.get_user_details, name='admin_user_details'),
    path('api/admin/users/<int:user_id>/suspend/', admin_views.suspend_user, name='admin_suspend_user'),
    path('api/admin/users/<int:user_id>/unsuspend/', admin_views.unsuspend_user, name='admin_unsuspend_user'),
    path('api/admin/users/<int:user_id>/delete/', admin_views.delete_user, name='admin_delete_user'),
    path('api/admin/users/<int:user_id>/give-points/', admin_views.give_points, name='admin_give_points'),
    path('api/admin/stats/', admin_views.get_system_stats, name='admin_stats'),
    path('api/admin/markets/', admin_views.get_markets_overview, name='admin_markets'),
    path('api/admin/audit-logs/', admin_views.get_audit_logs, name='admin_audit_logs'),

    path('api/admin/create-market/', admin_views.create_market, name='admin_create_market'),
    path('api/admin/settle-market/', admin_views.settle_market, name='admin_settle_market'),

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
    path('fetch_market/<int:market_id>/', fetch_market, name="fetch market"),
    path('fetch_leaderboard/', fetch_leaderboard, name="fetch leaderboard"),

    # USER URLS
    path('wallet/', get_wallet, name="wallet"),
    path('profile/', get_profile, name="profile"),
    path('change-username/', change_username, name="change-username"),
    path('change-password/', change_password, name="change-password" ),

    # GMAIL API URLS
    path('oauth2callback/', oauth2callback, name='oauth2callback'),
    path('authorise-gmail/', authorise_gmail, name='authorise-gmail'),

    # ORDER / TRADE URLS
    path('api/orders/', create_order),
    path('api/orderbook/<int:event_id>/', get_orderbook),

    # WALLET URLS
    path('api/wallet/trades/', get_user_trades, name="user-trades"),
    path('api/wallet/orders/', get_user_orders, name="user-orders"),
    path('api/wallet/positions/', get_user_positions, name="user-positions"),
    path('api/wallet/cancel-order/', cancel_order, name="cancel-order"),

]
