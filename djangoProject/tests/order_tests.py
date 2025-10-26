import json
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock

from ..views.order_view import create_order, get_orderbook
from ..models import Profiles, Events, Markets, Wallet, Orders


class OrderViewTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create role
        from ..models import Roles
        role = Roles.objects.create(role_name="regular user")
        
        # Create user
        self.user = Profiles.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="testpass123"
        )
        self.user.role = role
        self.user.save()
        
        # Create wallet for user
        Wallet.objects.create(profile=self.user, points_balance=Decimal('1000.00'))
        
        # Create market and event
        self.market = Markets.objects.create(
            market_name="Test Market",
            open=True,
            volume=0
        )
        
        self.event = Events.objects.create(
            market=self.market,
            event_name="Test Event",
            open=True,
            price=Decimal('0.50'),
            volume=0
        )

    @patch('djangoProject.views.order_view.Orderbooks')
    def test_create_order_success(self, mock_orderbooks_class):
        mock_orderbooks = MagicMock()
        mock_orderbooks_class.return_value = mock_orderbooks
        mock_orderbooks.submit_order.return_value = {
            'order_id': 1,
            'status': 'FILLED',
            'trades_executed': 1
        }
        
        request = self.factory.post('/api/orders/', {
            'event_id': self.event.id,
            'order_type': 'BUY',
            'share_type': 'YES',
            'quantity': 10,
            'price': 0.50
        }, format='json')
        force_authenticate(request, user=self.user)
        
        response = create_order(request)
        
        self.assertEqual(response.status_code, 200)

    def test_create_order_event_not_found(self):
        request = self.factory.post('/api/orders/', {
            'event_id': 999,
            'order_type': 'BUY',
            'share_type': 'YES',
            'quantity': 10,
            'price': 0.50
        }, format='json')
        force_authenticate(request, user=self.user)
        
        response = create_order(request)
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('not found', response.data['error'])

    def test_create_order_missing_data(self):
        request = self.factory.post('/api/orders/', {
            'order_type': 'BUY'
        }, format='json')
        force_authenticate(request, user=self.user)
        
        response = create_order(request)
        
        self.assertEqual(response.status_code, 400)

    @patch('djangoProject.views.order_view.Orderbooks')
    def test_create_order_validation_error(self, mock_orderbooks_class):
        mock_orderbooks = MagicMock()
        mock_orderbooks_class.return_value = mock_orderbooks
        mock_orderbooks.submit_order.side_effect = ValueError("Invalid quantity")
        
        request = self.factory.post('/api/orders/', {
            'event_id': self.event.id,
            'order_type': 'BUY',
            'share_type': 'YES',
            'quantity': -10,  # Invalid negative quantity
            'price': 0.50
        }, format='json')
        force_authenticate(request, user=self.user)
        
        response = create_order(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    @patch('djangoProject.views.order_view.Orderbooks')
    def test_get_orderbook_success(self, mock_orderbooks_class):
        mock_orderbooks = MagicMock()
        mock_orderbooks_class.return_value = mock_orderbooks
        mock_orderbooks.get_orderbook_snapshot.return_value = {
            'bids': [],
            'asks': [],
            'recent_trades': []
        }
        
        request = self.factory.get(f'/api/orderbook/{self.event.id}/')
        response = get_orderbook(request, self.event.id)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertIn('bids', data)
        self.assertIn('asks', data)

    def test_get_orderbook_event_not_found(self):
        request = self.factory.get('/api/orderbook/999/')
        response = get_orderbook(request, 999)
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('not found', json.loads(response.content)['error'])

    @patch('djangoProject.views.order_view.Orderbooks')
    def test_get_orderbook_server_error(self, mock_orderbooks_class):
        mock_orderbooks = MagicMock()
        mock_orderbooks_class.return_value = mock_orderbooks
        mock_orderbooks.get_orderbook_snapshot.side_effect = Exception("Database error")
        
        request = self.factory.get(f'/api/orderbook/{self.event.id}/')
        response = get_orderbook(request, self.event.id)
        
        self.assertEqual(response.status_code, 500)
        self.assertIn('Failed to fetch', json.loads(response.content)['error'])