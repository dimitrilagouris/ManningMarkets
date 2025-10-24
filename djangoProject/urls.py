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
from .views.wallet_views import get_user_trades, get_user_orders, get_user_positions, cancel_order
from .views.order_view import create_order, get_orderbook
from .views.admin_views import get_admin_users, get_admin_markets, get_admin_stats, suspend_user, unsuspend_user, delete_user, get_admin_audit_logs

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
    path('fetch_market/<int:market_id>/', fetch_market, name="fetch market"),
    path('fetch_leaderboard/', fetch_leaderboard, name="fetch leaderboard"),

    # USER URLS
    path('wallet/', get_wallet, name="wallet"),
    path('profile/', get_profile, name="profile"),
    path('change-username/', change_username, name="change-username"),
    path('change-password/', change_password, name="change-password" ),

    # WALLET URLS
    path('api/wallet/trades/', get_user_trades, name="user-trades"),
    path('api/wallet/orders/', get_user_orders, name="user-orders"),
    path('api/wallet/positions/', get_user_positions, name="user-positions"),
    path('api/wallet/cancel-order/', cancel_order, name="cancel-order"),

    # GMAIL API URLS
    path('oauth2callback/', oauth2callback, name='oauth2callback'),
    path('authorise-gmail/', authorise_gmail, name='authorise-gmail'),

    # ORDER / TRADE URLS
    path('api/orders/', create_order),
    path('api/orderbook/<int:event_id>/', get_orderbook),

    # ADMIN URLS
    path('api/admin/users/', get_admin_users, name="admin-users"),
    path('api/admin/markets/', get_admin_markets, name="admin-markets"),
    path('api/admin/stats/', get_admin_stats, name="admin-stats"),
    path('api/admin/audit-logs/', get_admin_audit_logs, name="admin-audit-logs"),
    path('api/admin/suspend-user/', suspend_user, name="admin-suspend-user"),
    path('api/admin/unsuspend-user/', unsuspend_user, name="admin-unsuspend-user"),
    path('api/admin/delete-user/', delete_user, name="admin-delete-user"),

]
