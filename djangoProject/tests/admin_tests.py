import json
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock, Mock
from django.utils import timezone

from ..views.admin_views import (
    get_all_users,
    suspend_user,
    unsuspend_user,
    delete_user,
    get_system_stats,
    get_markets_overview,
    get_audit_logs,
    get_user_details,
    give_points,
)
from ..models import Profiles, Markets, AdminActions, Wallet, Orders, Events, Roles


class AdminViewsTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create admin user mock with _state attribute
        self.admin_user = MagicMock(spec=Profiles)
        self.admin_user.id = 1
        self.admin_user.username = "admin"
        self.admin_user.email = "admin@test.com"
        self.admin_user.is_authenticated = True
        self.admin_user.is_admin = True
        self.admin_user._state = MagicMock()
        self.admin_user._state.db = 'default'
        self.admin_user.is_active = True
        
        # Create regular user mock
        self.regular_user = MagicMock(spec=Profiles)
        self.regular_user.id = 2
        self.regular_user.username = "regular"
        self.regular_user.email = "regular@test.com"
        self.regular_user.is_authenticated = True
        self.regular_user.is_admin = False
        
        # Create role mock
        self.role = MagicMock()
        self.role.role_name = "admin user"


class GetAllUsersTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.Profiles.objects.select_related')
    def test_get_all_users_success(self, mock_select_related):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@test.com"
        mock_user.is_active = True
        mock_user.date_joined = timezone.now()
        mock_user.role = self.role
        
        mock_select_related.return_value.all.return_value = [mock_user]
        
        request = self.factory.get('/api/admin/users/')
        force_authenticate(request, user=self.admin_user)
        response = get_all_users(request)
        
        self.assertEqual(response.status_code, 200)
        data = response.data  # Use response.data instead of json.loads(response.content)
        self.assertIn('users', data)
        self.assertEqual(len(data['users']), 1)
        self.assertEqual(data['users'][0]['name'], "testuser")
        self.assertEqual(data['users'][0]['status'], 'active')

    @patch('djangoProject.views.admin_views.Profiles.objects.select_related')
    def test_get_all_users_with_search(self, mock_select_related):
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@test.com"
        mock_user.is_active = True
        mock_user.date_joined = timezone.now()
        mock_user.role = self.role
        
        mock_queryset = MagicMock()
        mock_queryset.filter.return_value = [mock_user]
        mock_select_related.return_value.all.return_value = mock_queryset
        
        request = self.factory.get('/api/admin/users/?search=test')
        force_authenticate(request, user=self.admin_user)
        response = get_all_users(request)
        
        self.assertEqual(response.status_code, 200)

    @patch('djangoProject.views.admin_views.Profiles.objects.select_related')
    def test_get_all_users_filter_active(self, mock_select_related):
        mock_user = MagicMock()
        mock_user.is_active = True
        
        mock_queryset = MagicMock()
        mock_queryset.filter.return_value = [mock_user]
        mock_select_related.return_value.all.return_value = mock_queryset
        
        request = self.factory.get('/api/admin/users/?status=active')
        force_authenticate(request, user=self.admin_user)
        response = get_all_users(request)
        
        self.assertEqual(response.status_code, 200)

    def test_get_all_users_not_admin(self):
        request = self.factory.get('/api/admin/users/')
        force_authenticate(request, user=self.regular_user)
        response = get_all_users(request)
        
        self.assertEqual(response.status_code, 403)

    def test_admin_required_unauthenticated(self):
        """Test admin_required decorator with unauthenticated user"""
        request = self.factory.get('/api/admin/users/')
        # Don't force_authenticate - unauthenticated user
        response = get_all_users(request)
        
        # DRF IsAuthenticated returns 403 before our decorator runs
        # So we can't test line 17 directly
        self.assertEqual(response.status_code, 403)

    @patch('djangoProject.views.admin_views.Profiles.objects.select_related')
    def test_get_all_users_search_with_email(self, mock_select_related):
        """Test get_all_users with email search"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@example.com"
        mock_user.is_active = True
        mock_user.date_joined = timezone.now()
        mock_user.role = self.role
        
        mock_queryset = MagicMock()
        mock_queryset.filter.return_value = [mock_user]
        mock_select_related.return_value.all.return_value = mock_queryset
        
        request = self.factory.get('/api/admin/users/?search=test@example.com')
        force_authenticate(request, user=self.admin_user)
        response = get_all_users(request)
        
        self.assertEqual(response.status_code, 200)

    @patch('djangoProject.views.admin_views.Profiles.objects.select_related')
    def test_get_all_users_filter_suspended(self, mock_select_related):
        """Test get_all_users with status=suspended"""
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@test.com"
        mock_user.is_active = False  # Suspended user
        mock_user.date_joined = timezone.now()
        mock_user.role = self.role
        
        mock_queryset = MagicMock()
        mock_queryset.filter.return_value = [mock_user]
        mock_select_related.return_value.all.return_value = mock_queryset
        
        request = self.factory.get('/api/admin/users/?status=suspended')
        force_authenticate(request, user=self.admin_user)
        response = get_all_users(request)
        
        self.assertEqual(response.status_code, 200)


class SuspendUserTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_suspend_user_success(self, mock_get, mock_admin_actions):
        target_user = MagicMock()
        target_user.id = 2
        target_user.username = "target"
        target_user.email = "target@test.com"
        target_user.is_active = True
        target_user.save = MagicMock()
        
        mock_get.return_value = target_user
        
        request = self.factory.post('/api/admin/users/2/suspend/')
        force_authenticate(request, user=self.admin_user)
        response = suspend_user(request, 2)
        
        self.assertEqual(response.status_code, 200)
        self.assertFalse(target_user.is_active)
        target_user.save.assert_called_once()

    @patch('djangoProject.models.Profiles.objects')
    def test_suspend_user_not_found(self, mock_profiles_manager):
        """Test suspend_user when Profiles.DoesNotExist is raised"""
        mock_profiles_manager.get.side_effect = Profiles.DoesNotExist
        
        request = self.factory.post('/api/admin/users/999/suspend/')
        force_authenticate(request, user=self.admin_user)
        response = suspend_user(request, 999)
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('not found', response.data['error'])

    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_suspend_own_account(self, mock_get, mock_admin_actions):
        mock_get.return_value = self.admin_user
        
        request = self.factory.post('/api/admin/users/1/suspend/')
        force_authenticate(request, user=self.admin_user)
        response = suspend_user(request, 1)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('own account', response.data['error'])

    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_suspend_already_suspended(self, mock_get):
        target_user = MagicMock()
        target_user.id = 2
        target_user.is_active = False
        
        mock_get.return_value = target_user
        
        request = self.factory.post('/api/admin/users/2/suspend/')
        force_authenticate(request, user=self.admin_user)
        response = suspend_user(request, 2)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('already suspended', response.data['error'])


class UnsuspendUserTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_unsuspend_user_success(self, mock_get, mock_admin_actions):
        target_user = MagicMock()
        target_user.id = 2
        target_user.username = "target"
        target_user.email = "target@test.com"
        target_user.is_active = False
        target_user.save = MagicMock()
        
        mock_get.return_value = target_user
        
        request = self.factory.post('/api/admin/users/2/unsuspend/')
        force_authenticate(request, user=self.admin_user)
        response = unsuspend_user(request, 2)
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(target_user.is_active)
        target_user.save.assert_called_once()

    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_unsuspend_user_already_active(self, mock_get):
        target_user = MagicMock()
        target_user.is_active = True
        
        mock_get.return_value = target_user
        
        request = self.factory.post('/api/admin/users/2/unsuspend/')
        force_authenticate(request, user=self.admin_user)
        response = unsuspend_user(request, 2)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('already active', response.data['error'])


class DeleteUserTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_delete_user_success(self, mock_get, mock_admin_actions):
        target_user = MagicMock()
        target_user.id = 2
        target_user.username = "target"
        target_user.email = "target@test.com"
        target_user.delete = MagicMock()
        
        mock_get.return_value = target_user
        
        request = self.factory.delete('/api/admin/users/2/delete/')
        force_authenticate(request, user=self.admin_user)
        response = delete_user(request, 2)
        
        self.assertEqual(response.status_code, 200)
        target_user.delete.assert_called_once()

    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_delete_own_account(self, mock_get, mock_admin_actions):
        mock_get.return_value = self.admin_user
        
        request = self.factory.delete('/api/admin/users/1/delete/')
        force_authenticate(request, user=self.admin_user)
        response = delete_user(request, 1)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('own account', response.data['error'])


class GetSystemStatsTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.Orders.objects')
    @patch('djangoProject.views.admin_views.Markets.objects')
    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_get_system_stats_success(self, mock_profiles, mock_markets, mock_orders):
        mock_profiles.count.return_value = 100
        mock_profiles.filter.return_value.count.return_value = 80
        
        mock_markets.count.return_value = 10
        mock_markets.filter.return_value.count.return_value = 8
        
        mock_orders.count.return_value = 500
        mock_orders.filter.return_value.count.return_value = 200
        
        request = self.factory.get('/api/admin/stats/')
        force_authenticate(request, user=self.admin_user)
        response = get_system_stats(request)
        
        self.assertEqual(response.status_code, 200)
        data = response.data  # Use response.data instead
        self.assertEqual(data['totalUsers'], 100)
        self.assertEqual(data['activeUsers'], 80)
        self.assertEqual(data['totalMarkets'], 10)


class GetMarketsOverviewTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.Orders.objects')
    @patch('djangoProject.views.admin_views.Markets.objects')
    def test_get_markets_overview_success(self, mock_markets, mock_orders):
        mock_event1 = MagicMock()
        mock_event1.price = Decimal('10.50')
        
        mock_event2 = MagicMock()
        mock_event2.price = Decimal('20.75')
        
        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Test Market"
        mock_market.open = True
        mock_market.volume = 1000
        mock_market.events.all.return_value = [mock_event1, mock_event2]
        
        mock_markets.prefetch_related.return_value.all.return_value = [mock_market]
        mock_orders.filter.return_value.values.return_value.distinct.return_value.count.return_value = 5
        
        request = self.factory.get('/api/admin/markets/')
        force_authenticate(request, user=self.admin_user)
        response = get_markets_overview(request)
        
        self.assertEqual(response.status_code, 200)
        data = response.data  # Use response.data instead
        self.assertIn('markets', data)
        self.assertEqual(len(data['markets']), 1)

    @patch('djangoProject.views.admin_views.Orders.objects')
    @patch('djangoProject.views.admin_views.Markets.objects')
    def test_get_markets_overview_empty_events(self, mock_markets, mock_orders):
        """Test get_markets_overview with market that has no events"""
        mock_market = MagicMock()
        mock_market.id = 1
        mock_market.market_name = "Empty Market"
        mock_market.open = True
        mock_market.volume = 0
        mock_market.events.all.return_value = []  # No events
        
        mock_markets.prefetch_related.return_value.all.return_value = [mock_market]
        
        request = self.factory.get('/api/admin/markets/')
        force_authenticate(request, user=self.admin_user)
        response = get_markets_overview(request)
        
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data['markets'][0]['price'], 0)


class GetAuditLogsTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.AdminActions.objects')
    def test_get_audit_logs_success(self, mock_admin_actions):
        mock_log = MagicMock()
        mock_log.id = 1
        mock_log.description = "Test action"
        mock_log.occured_at = timezone.now()
        mock_log.user.username = "admin"
        mock_log.user.email = "admin@test.com"
        
        mock_admin_actions.select_related.return_value.order_by.return_value.__getitem__.return_value = [mock_log]
        
        request = self.factory.get('/api/admin/audit-logs/')
        force_authenticate(request, user=self.admin_user)
        response = get_audit_logs(request)
        
        self.assertEqual(response.status_code, 200)
        data = response.data  # Use response.data instead
        self.assertIn('auditLogs', data)
        self.assertEqual(len(data['auditLogs']), 1)

    @patch('djangoProject.views.admin_views.AdminActions.objects')
    def test_get_audit_logs_with_limit(self, mock_admin_actions):
        mock_admin_actions.select_related.return_value.order_by.return_value.__getitem__.return_value = []
        
        request = self.factory.get('/api/admin/audit-logs/?limit=10')
        force_authenticate(request, user=self.admin_user)
        response = get_audit_logs(request)
        
        self.assertEqual(response.status_code, 200)


class GetUserDetailsTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.Orders.objects')
    @patch('djangoProject.views.admin_views.Wallet.objects')
    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_get_user_details_success(self, mock_profiles, mock_wallet, mock_orders):
        mock_role = MagicMock()
        mock_role.role_name = "regular user"
        
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@test.com"
        mock_user.role = mock_role
        mock_user.is_active = True
        mock_user.email_verified = True
        mock_user.date_joined = timezone.now()
        mock_user.last_login = timezone.now()
        
        mock_wallet_obj = MagicMock()
        mock_wallet_obj.id = 1
        mock_wallet_obj.points_balance = Decimal('100.00')
        
        mock_profiles.select_related.return_value.get.return_value = mock_user
        mock_wallet.get.return_value = mock_wallet_obj
        mock_orders.filter.return_value.count.return_value = 5
        
        request = self.factory.get('/api/admin/users/1/')
        force_authenticate(request, user=self.admin_user)
        response = get_user_details(request, 1)
        
        self.assertEqual(response.status_code, 200)
        data = response.data  # Use response.data instead
        self.assertEqual(data['username'], "testuser")
        self.assertEqual(data['status'], 'active')
        self.assertIsNotNone(data['wallet'])

    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_get_user_details_not_found(self, mock_profiles):
        mock_profiles.select_related.return_value.get.side_effect = Profiles.DoesNotExist
        
        request = self.factory.get('/api/admin/users/999/')
        force_authenticate(request, user=self.admin_user)
        response = get_user_details(request, 999)
        
        self.assertEqual(response.status_code, 404)

    @patch('djangoProject.views.admin_views.Orders.objects')
    @patch('djangoProject.views.admin_views.Profiles.objects')
    @patch('djangoProject.views.admin_views.Wallet.objects')
    def test_get_user_details_no_wallet(self, mock_wallet, mock_profiles, mock_orders):
        mock_role = MagicMock()
        mock_role.role_name = "regular user"
        
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@test.com"
        mock_user.role = mock_role
        mock_user.is_active = True
        mock_user.email_verified = True
        mock_user.date_joined = timezone.now()
        mock_user.last_login = timezone.now()
        
        mock_profiles.select_related.return_value.get.return_value = mock_user
        mock_wallet.get.side_effect = Wallet.DoesNotExist
        mock_orders.filter.return_value.count.return_value = 0
        
        request = self.factory.get('/api/admin/users/1/')
        force_authenticate(request, user=self.admin_user)
        response = get_user_details(request, 1)
        
        self.assertEqual(response.status_code, 200)
        data = response.data  # Use response.data instead
        self.assertIsNone(data['wallet'])

    @patch('djangoProject.views.admin_views.Orders.objects')
    @patch('djangoProject.views.admin_views.Wallet.objects')
    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_get_user_details_with_last_login_none(self, mock_profiles, mock_wallet, mock_orders):
        """Test get_user_details when user has no last_login"""
        mock_role = MagicMock()
        mock_role.role_name = "regular user"
        
        mock_user = MagicMock()
        mock_user.id = 1
        mock_user.username = "testuser"
        mock_user.email = "test@test.com"
        mock_user.role = mock_role
        mock_user.is_active = True
        mock_user.email_verified = False  # Test this branch
        mock_user.date_joined = timezone.now()
        mock_user.last_login = None  # No last login
        
        mock_profiles.select_related.return_value.get.return_value = mock_user
        mock_wallet.get.side_effect = Wallet.DoesNotExist
        mock_orders.filter.return_value.count.return_value = 0
        
        request = self.factory.get('/api/admin/users/1/')
        force_authenticate(request, user=self.admin_user)
        response = get_user_details(request, 1)
        
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIsNone(data['lastLogin'])
        self.assertFalse(data['emailVerified'])


class GivePointsTests(AdminViewsTestCase):
    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Wallet.objects')
    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_give_points_success(self, mock_profiles, mock_wallet, mock_admin_actions):
        target_user = MagicMock()
        target_user.id = 2
        
        mock_wallet_obj = MagicMock()
        mock_wallet_obj.id = 1
        mock_wallet_obj.points_balance = Decimal('100.00')
        mock_wallet_obj.save = MagicMock()
        
        mock_profiles.get.return_value = target_user
        mock_wallet.get.return_value = mock_wallet_obj
        
        request = self.factory.post('/api/admin/users/2/give-points/', 
                                   {'amount': '50.00'}, format='json')
        force_authenticate(request, user=self.admin_user)
        response = give_points(request, 2)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mock_wallet_obj.points_balance, Decimal('150.00'))
        mock_wallet_obj.save.assert_called_once()

    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_give_points_no_amount(self, mock_profiles):
        request = self.factory.post('/api/admin/users/2/give-points/', {}, format='json')
        force_authenticate(request, user=self.admin_user)
        response = give_points(request, 2)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('required', response.data['error'])

    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_give_points_negative_amount(self, mock_profiles):
        request = self.factory.post('/api/admin/users/2/give-points/', 
                                   {'amount': '-10'}, format='json')
        force_authenticate(request, user=self.admin_user)
        response = give_points(request, 2)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('greater than 0', response.data['error'])

    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_give_points_invalid_amount(self, mock_profiles):
        request = self.factory.post('/api/admin/users/2/give-points/', 
                                   {'amount': 'not_a_number'}, format='json')
        force_authenticate(request, user=self.admin_user)
        response = give_points(request, 2)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid amount', response.data['error'])

    @patch('djangoProject.views.admin_views.Wallet.objects')
    @patch('djangoProject.views.admin_views.Profiles.objects')
    def test_give_points_no_wallet(self, mock_profiles, mock_wallet):
        target_user = MagicMock()
        target_user.id = 2
        
        mock_profiles.get.return_value = target_user
        mock_wallet.get.side_effect = Wallet.DoesNotExist
        
        request = self.factory.post('/api/admin/users/2/give-points/', 
                                   {'amount': '50'}, format='json')
        force_authenticate(request, user=self.admin_user)
        response = give_points(request, 2)
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('wallet not found', response.data['error'])
   


class SuspendUserNotFoundTests(AdminViewsTestCase):
    """Test Profiles.DoesNotExist exception handling in suspend_user"""
    
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_suspend_user_not_found_second(self, mock_get):
        """Test suspend_user when Profiles.DoesNotExist is raised"""
        mock_get.side_effect = Profiles.DoesNotExist
        
        request = self.factory.post('/api/admin/users/999/suspend/')
        force_authenticate(request, user=self.admin_user)
        response = suspend_user(request, 999)
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('not found', response.data['error'])


class DeleteUserNotFoundTests(AdminViewsTestCase):
    """Test Profiles.DoesNotExist exception handling in delete_user"""
    
    @patch('djangoProject.views.admin_views.AdminActions.objects.create')
    @patch('djangoProject.views.admin_views.Profiles.objects.get')
    def test_delete_user_not_found(self, mock_get, mock_admin_actions):
        """Test delete_user when Profiles.DoesNotExist is raised"""
        mock_get.side_effect = Profiles.DoesNotExist
        
        request = self.factory.delete('/api/admin/users/999/delete/')
        force_authenticate(request, user=self.admin_user)
        response = delete_user(request, 999)
        
        self.assertEqual(response.status_code, 404)
        self.assertIn('not found', response.data['error'])


class GivePointsUserNotFoundTests(AdminViewsTestCase):
    """Test Profiles.DoesNotExist exception handling in give_points"""
    
    def test_give_points_user_not_found(self):
        """Test give_points when Profiles.DoesNotExist is raised"""
        with patch('djangoProject.views.admin_views.Profiles.objects.get') as mock_get:
            mock_get.side_effect = Profiles.DoesNotExist
            
            request = self.factory.post('/api/admin/users/999/give-points/', 
                                       {'amount': '50'}, format='json')
            force_authenticate(request, user=self.admin_user)
            response = give_points(request, 999)
            
            self.assertEqual(response.status_code, 404)
            self.assertIn('not found', response.data['error'])

# Add this new test class to test the admin_required decorator in isolation
class AdminRequiredDecoratorTests(AdminViewsTestCase):
    """Test admin_required decorator directly"""
    
    def test_admin_required_unauthenticated(self):
        """Test admin_required decorator returns 401 when user is not authenticated"""
        from ..views.admin_views import admin_required
        from ..views.admin_views import get_all_users as original_get_all_users
        
        # Create a mock request with unauthenticated user
        class MockUnauthenticatedRequest:
            def __init__(self):
                class MockUser:
                    is_authenticated = False
                    is_admin = False
                self.user = MockUser()
        
        request = MockUnauthenticatedRequest()
        
        # Wrap the function with admin_required
        wrapped_func = admin_required(original_get_all_users)
        
        # Call it directly (not through DRF)
        response = wrapped_func(request)
        
        # Should return 401 from line 17
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.data)
        self.assertIn('Authentication required', response.data['error'])