import json
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from unittest.mock import patch, MagicMock
from decimal import Decimal

from ..views.market_views import fetch_leaderboard, fetch_markets
from ..models import Markets, Events, Profiles

class MarketViewsTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_ajax_success(self, mock_filter):
        # Setup mock market and events
        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.event_name = "Event 1"
        mock_event.price = 10
        mock_event.volume = 50

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Market 1"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event]

        mock_filter.return_value.prefetch_related.return_value = [mock_market]

        request = self.factory.get('/fetch_markets', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('markets', data)
        self.assertEqual(len(data['markets']), 1)
        self.assertEqual(data['markets'][0]['events'][0]['name'], "Event 1")

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_ajax_empty(self, mock_filter):
        # Test empty queryset
        mock_filter.return_value.prefetch_related.return_value = []

        request = self.factory.get('/fetch_markets', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['markets'], [])

    def test_fetch_markets_non_ajax_bad_request(self):
        request = self.factory.get('/fetch_markets')
        response = fetch_markets(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content.decode(), "Invalid Request Type")

    @patch('djangoProject.views.market_views.Profiles.objects.filter')
    def test_fetch_leaderboard_ajax_success(self, mock_filter):
        # Setup mock users and wallets
        mock_wallet = MagicMock()
        mock_wallet.points_balance = Decimal("100.50")

        mock_user1 = MagicMock()
        mock_user1.username = "user1"
        mock_user1.is_active = True
        mock_user1.wallet = mock_wallet

        mock_user2 = MagicMock()
        mock_user2.username = "user2"
        mock_user2.is_active = True
        mock_user2.wallet = None  # no wallet

        mock_filter.return_value.select_related.return_value.order_by.return_value = [mock_user1, mock_user2]

        request = self.factory.get('/fetch_leaderboard', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_leaderboard(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('markets', data)
        self.assertEqual(len(data['markets']), 2)
        self.assertEqual(data['markets'][0]['balance'], 100.50)
        self.assertEqual(data['markets'][1]['balance'], 0.0)

    @patch('djangoProject.views.market_views.Profiles.objects.filter')
    def test_fetch_leaderboard_ajax_empty(self, mock_filter):
        # Test empty queryset
        mock_filter.return_value.select_related.return_value.order_by.return_value = []

        request = self.factory.get('/fetch_leaderboard', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_leaderboard(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['markets'], [])

    def test_fetch_leaderboard_non_ajax_bad_request(self):
        request = self.factory.get('/fetch_leaderboard')
        response = fetch_leaderboard(request)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.content.decode(), "Invalid Request Type")

    @patch('djangoProject.views.market_views.Profiles.objects.filter')
    def test_fetch_leaderboard_user_without_wallet(self, mock_filter):
        # User exists but wallet is missing
        mock_user = MagicMock()
        mock_user.username = "user1"
        mock_user.is_active = True
        mock_user.wallet = None

        mock_filter.return_value.select_related.return_value.order_by.return_value = [mock_user]

        request = self.factory.get('/fetch_leaderboard', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_leaderboard(request)

        data = json.loads(response.content)
        self.assertEqual(data['markets'][0]['balance'], 0.0)
