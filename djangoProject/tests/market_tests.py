import json
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from unittest.mock import patch, MagicMock
from decimal import Decimal

from ..views.market_views import fetch_leaderboard, fetch_markets, fetch_market
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

        # Create a mock queryset that supports chaining
        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

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
        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = []
        mock_filter.return_value = mock_qs

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

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_market_ajax_success(self, mock_filter):
        # Setup mock market and events
        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.event_name = "Event 1"
        mock_event.price = Decimal('0.50')
        mock_event.volume = 50

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Market 1"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event]

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.first.return_value = mock_market
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_market/1/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_market(request, 1)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('market', data)
        self.assertEqual(data['market']['name'], "Market 1")

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_market_not_found(self, mock_filter):
        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.first.return_value = None
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_market/999/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_market(request, 999)

        self.assertEqual(response.status_code, 404)
        data = json.loads(response.content)
        self.assertIn('not found', data['error'])

    def test_fetch_market_non_ajax_bad_request(self):
        request = self.factory.get('/fetch_market/1/')
        response = fetch_market(request, 1)
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

        mock_qs = MagicMock()
        mock_qs.select_related.return_value.order_by.return_value = [mock_user1, mock_user2]
        mock_filter.return_value = mock_qs

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
        mock_qs = MagicMock()
        mock_qs.select_related.return_value.order_by.return_value = []
        mock_filter.return_value = mock_qs

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

        mock_qs = MagicMock()
        mock_qs.select_related.return_value.order_by.return_value = [mock_user]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_leaderboard', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_leaderboard(request)

        data = json.loads(response.content)
        self.assertEqual(data['markets'][0]['balance'], 0.0)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_with_search_query(self, mock_filter):
        """Test fetch_markets with search parameter 'q'"""
        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.event_name = "Event 1"
        mock_event.price = 10
        mock_event.volume = 50

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Test Market"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event]

        mock_qs = MagicMock()
        mock_qs.filter.return_value.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets?q=Test', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('markets', data)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_market_exception_handling(self, mock_filter):
        """Test fetch_market exception handling"""
        mock_qs = MagicMock()
        mock_qs.prefetch_related.side_effect = Exception("Database error")
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_market/1/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_market(request, 1)

        self.assertEqual(response.status_code, 500)
        data = json.loads(response.content)
        self.assertIn('error', data)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_with_empty_search_query(self, mock_filter):
        """Test fetch_markets with empty search query"""
        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.event_name = "Event 1"
        mock_event.price = 10
        mock_event.volume = 50

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Market"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event]

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets?q=', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('markets', data)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_with_whitespace_search_query(self, mock_filter):
        """Test fetch_markets with whitespace-only search query"""
        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.event_name = "Event 1"
        mock_event.price = 10
        mock_event.volume = 50

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Market"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event]

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets?q=   ', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('markets', data)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_with_multiple_events(self, mock_filter):
        """Test fetch_markets with multiple events per market"""
        mock_event1 = MagicMock()
        mock_event1.id = 1
        mock_event1.event_name = "Event 1"
        mock_event1.price = 10
        mock_event1.volume = 50

        mock_event2 = MagicMock()
        mock_event2.id = 2
        mock_event2.event_name = "Event 2"
        mock_event2.price = 20
        mock_event2.volume = 100

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Market 1"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event1, mock_event2]

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['markets']), 1)
        self.assertEqual(len(data['markets'][0]['events']), 2)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_with_no_events(self, mock_filter):
        """Test fetch_markets with market that has no events"""
        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Empty Market"
        mock_market.volume = 0
        mock_market.events.all.return_value = []

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['markets'][0]['events']), 0)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_multiple_markets(self, mock_filter):
        """Test fetch_markets with multiple markets"""
        mock_event = MagicMock()
        mock_event.id = 1
        mock_event.event_name = "Event"
        mock_event.price = 10
        mock_event.volume = 50

        mock_market1 = MagicMock()
        mock_market1.id = 1
        mock_market1.market_name = "Market 1"
        mock_market1.volume = 1000
        mock_market1.events.all.return_value = [mock_event]

        mock_market2 = MagicMock()
        mock_market2.id = 2
        mock_market2.market_name = "Market 2"
        mock_market2.volume = 2000
        mock_market2.events.all.return_value = [mock_event]

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market1, mock_market2]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['markets']), 2)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_market_with_multiple_events(self, mock_filter):
        """Test fetch_market with multiple events"""
        mock_event1 = MagicMock()
        mock_event1.id = 1
        mock_event1.event_name = "Event 1"
        mock_event1.price = Decimal('0.50')
        mock_event1.volume = 50

        mock_event2 = MagicMock()
        mock_event2.id = 2
        mock_event2.event_name = "Event 2"
        mock_event2.price = Decimal('0.75')
        mock_event2.volume = 75

        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Market 1"
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event1, mock_event2]

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.first.return_value = mock_market
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_market/1/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_market(request, 1)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['market']['events']), 2)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_market_with_no_events(self, mock_filter):
        """Test fetch_market with market that has no events"""
        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Empty Market"
        mock_market.volume = 0
        mock_market.events.all.return_value = []

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.first.return_value = mock_market
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_market/1/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_market(request, 1)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['market']['events']), 0)

    @patch('djangoProject.views.market_views.Profiles.objects.filter')
    def test_fetch_leaderboard_with_wallet(self, mock_filter):
        """Test fetch_leaderboard with user that has wallet"""
        mock_wallet = MagicMock()
        mock_wallet.points_balance = Decimal("50.25")

        mock_user = MagicMock()
        mock_user.username = "user1"
        mock_user.is_active = True
        mock_user.wallet = mock_wallet

        mock_qs = MagicMock()
        mock_qs.select_related.return_value.order_by.return_value = [mock_user]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_leaderboard', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_leaderboard(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['markets'][0]['balance'], 50.25)

    @patch('djangoProject.views.market_views.Profiles.objects.filter')
    def test_fetch_leaderboard_multiple_users(self, mock_filter):
        """Test fetch_leaderboard with multiple users"""
        mock_wallet1 = MagicMock()
        mock_wallet1.points_balance = Decimal("200.00")

        mock_wallet2 = MagicMock()
        mock_wallet2.points_balance = Decimal("100.00")

        mock_user1 = MagicMock()
        mock_user1.username = "user1"
        mock_user1.is_active = True
        mock_user1.wallet = mock_wallet1

        mock_user2 = MagicMock()
        mock_user2.username = "user2"
        mock_user2.is_active = True
        mock_user2.wallet = mock_wallet2

        mock_qs = MagicMock()
        mock_qs.select_related.return_value.order_by.return_value = [mock_user1, mock_user2]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_leaderboard', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_leaderboard(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(len(data['markets']), 2)
        self.assertEqual(data['markets'][0]['balance'], 200.0)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_filters_open_markets_only(self, mock_filter):
        """Test that fetch_markets only returns open markets"""
        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Open Market"
        mock_market.volume = 1000
        mock_market.events.all.return_value = []

        mock_qs = MagicMock()
        mock_qs.prefetch_related.return_value.order_by.return_value = [mock_market]
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        mock_filter.assert_called_with(open=True)
        self.assertEqual(response.status_code, 200)

    @patch('djangoProject.views.market_views.Markets.objects.filter')
    def test_fetch_markets_with_search_parameter(self, mock_filter):
        """Test fetch_markets with search filtering"""
        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Tech Market"
        mock_market.volume = 1000
        mock_market.events.all.return_value = []

        mock_qs_filtered = MagicMock()
        mock_qs_filtered.prefetch_related.return_value.order_by.return_value = [mock_market]
        
        mock_qs = MagicMock()
        mock_qs.filter.return_value = mock_qs_filtered
        mock_filter.return_value = mock_qs

        request = self.factory.get('/fetch_markets?q=Tech', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        response = fetch_markets(request)

        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('markets', data)
