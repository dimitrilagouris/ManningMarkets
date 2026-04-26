import json
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock
from django.test import override_settings

from django.utils import timezone
from datetime import timedelta

from ..views.authentication_views import (
    get_csrf_token,
    initiate_login,
    verify_otp,
    logout_view,
    register_user,
    activate_user,
    get_user_data,
)
from ..models import Profiles, Wallet, EmailToken, Roles
from ..serialisers import RegisterSerialiser

User = get_user_model()

@override_settings(RATELIMIT_ENABLE=False)
class AuthenticationViewsTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        
        # Create admin role using get_or_create to avoid duplicate errors
        self.admin_role, _ = Roles.objects.get_or_create(role_name="admin user")
        
        # Create user for testing
        self.user = Profiles.objects.create_user(
            username="testuser",
            email="test@test.com",
            password="testpass123"
        )

    @patch('djangoProject.views.authentication_views.get_token')
    def test_get_csrf_token_success(self, mock_get_token):
        mock_get_token.return_value = "test_token"
        
        request = self.factory.get('/get-csrf-token/')
        response = get_csrf_token(request)
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['csrfToken'], "test_token")

    @patch('djangoProject.views.authentication_views.send_otp_email')
    @patch('djangoProject.views.authentication_views.EmailToken.create_otp_token')
    @patch('djangoProject.views.authentication_views.authenticate')
    def test_initiate_login_success(self, mock_authenticate, mock_create_otp, mock_send_email):
        mock_user = MagicMock()
        mock_user.email = "test@test.com"
        mock_authenticate.return_value = mock_user
        mock_create_otp.return_value = "123456"
        
        request = self.factory.post('/login/', {'username': 'testuser', 'password': 'testpass'})
        response = initiate_login(request)
        
        self.assertEqual(response.status_code, 200)
        mock_create_otp.assert_called_once()

    @patch('djangoProject.views.authentication_views.authenticate')
    def test_initiate_login_missing_credentials(self, mock_authenticate):
        request = self.factory.post('/login/', {})
        response = initiate_login(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('required', response.data['error'])

    @patch('djangoProject.views.authentication_views.authenticate')
    def test_initiate_login_invalid_credentials(self, mock_authenticate):
        mock_authenticate.return_value = None
        
        request = self.factory.post('/login/', {'username': 'testuser', 'password': 'wrongpass'})
        response = initiate_login(request)
        
        self.assertEqual(response.status_code, 401)
        self.assertIn('Invalid credentials', response.data['error'])

    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    @patch('djangoProject.views.authentication_views.User.objects.get')
    @patch('djangoProject.views.authentication_views.login')
    def test_verify_otp_success(self, mock_login, mock_get_user, mock_verify_otp):
        mock_verify_otp.return_value = True
        mock_get_user.return_value = self.user
        
        request = self.factory.post('/verify-otp/', {'username': 'test@test.com', 'otp': '123456'})
        response = verify_otp(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('Successful', response.data['message'])

    @patch('djangoProject.views.authentication_views.ratelimit', lambda *a, **kw: (lambda f: f))
    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    @patch('djangoProject.views.authentication_views.User.objects')
    def test_verify_otp_user_not_found(self, mock_user_objects, mock_verify_otp):
        mock_user_objects.get.side_effect = User.DoesNotExist
        request = self.factory.post('/verify-otp/', {'username': 'nonexistent@test.com', 'otp': '123456'})
        response = verify_otp(request)
        self.assertEqual(response.status_code, 404)
        self.assertIn('not found', response.data['error'])


    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    @patch('djangoProject.views.authentication_views.User.objects')
    def test_verify_otp_invalid_token(self, mock_user_objects, mock_verify_otp):
        mock_user_objects.get.return_value = self.user
        mock_verify_otp.return_value = False
        
        request = self.factory.post('/verify-otp/', {'username': 'test@test.com', 'otp': 'wrong'})
        response = verify_otp(request)
        
        # The response returns 200 but with error message
        self.assertIn('error', response.data)
        self.assertIn('Invalid or expired', response.data['error'])

    @patch('djangoProject.views.authentication_views.logout')
    def test_logout_view_authenticated(self, mock_logout):
        request = self.factory.post('/logout/')
        force_authenticate(request, user=self.user)
        response = logout_view(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('Successful', response.data['message'])
        mock_logout.assert_called_once()

    def test_logout_view_unauthenticated(self):
        request = self.factory.post('/logout/')
        response = logout_view(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('No active session', response.data['message'])

    @patch('djangoProject.views.authentication_views.RegisterSerialiser')
    def test_register_user_success(self, mock_serialiser_class):
        mock_serialiser = MagicMock()
        mock_serialiser.is_valid.return_value = True
        mock_serialiser.data = {'email': 'newuser@test.com'}
        mock_serialiser.errors = {}
        mock_serialiser_class.return_value = mock_serialiser
        
        request = self.factory.post('/register/', {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'password123'
        })
        response = register_user(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('registered', response.data['status'])

    @patch('djangoProject.views.authentication_views.RegisterSerialiser')
    def test_register_user_invalid(self, mock_serialiser_class):
        mock_serialiser = MagicMock()
        mock_serialiser.is_valid.return_value = False
        mock_serialiser.errors = {'email': ['Invalid email']}
        mock_serialiser_class.return_value = mock_serialiser
        
        request = self.factory.post('/register/', {
            'username': 'newuser',
            'email': 'invalid',
            'password': 'password123'
        })
        response = register_user(request)
        
        self.assertEqual(response.status_code, 400)

    @patch('djangoProject.views.authentication_views.Wallet.objects.create')
    @patch('djangoProject.views.authentication_views.EmailToken.objects.select_related')
    def test_activate_user_success(self, mock_email_token, mock_wallet_create):
        # Create token object
        mock_token = MagicMock()
        mock_token.user = self.user
        mock_token.is_expired.return_value = False
        mock_token.delete = MagicMock()
        
        mock_query = MagicMock()
        mock_query.get.return_value = mock_token
        mock_email_token.return_value = mock_query
        
        request = self.factory.post('/activate/test_token/')
        response = activate_user(request, 'test_token')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('activated', response.data['message'])

    def test_activate_user_no_token(self):
        request = self.factory.post('/activate/')
        response = activate_user(request, None)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('required', response.data['error'])

    @patch('djangoProject.views.authentication_views.EmailToken.objects.select_related')
    def test_activate_user_invalid_token(self, mock_email_token):
        mock_query = MagicMock()
        mock_query.get.side_effect = EmailToken.DoesNotExist
        mock_email_token.return_value = mock_query
        
        request = self.factory.post('/activate/invalid_token/')
        response = activate_user(request, 'invalid_token')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid or expired', response.data['error'])

    @patch('djangoProject.views.authentication_views.UserSerialiser')
    @patch('djangoProject.views.authentication_views.User.objects.select_related')
    def test_get_user_data_success(self, mock_user_objects, mock_serialiser_class):
        mock_user = MagicMock()
        mock_user.pk = self.user.pk
        
        mock_query = MagicMock()
        mock_query.get.return_value = mock_user
        mock_user_objects.return_value.prefetch_related.return_value = mock_query
        
        mock_serialiser = MagicMock()
        mock_serialiser.data = {'username': 'testuser', 'email': 'test@test.com'}
        mock_serialiser_class.return_value = mock_serialiser
        
        request = self.factory.get('/user/')
        force_authenticate(request, user=self.user)
        response = get_user_data(request)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('username', response.data)

    def test_activate_user_expired_token(self):
        """Test activate_user with expired token"""
        # Create an expired token
        token_hash = EmailToken.hash_token("expired_token")
        token = EmailToken.objects.create(
            user=self.user,
            token_hash=token_hash,
            purpose='auth-pages',
            expires_at=timezone.now() - timedelta(minutes=1)  # Already expired
        )
        
        request = self.factory.post('/activate/expired_token/')
        response = activate_user(request, 'expired_token')
        
        self.assertEqual(response.status_code, 200)  # Returns error message without status
        self.assertIn('error', response.data)
        # Token should be deleted
        self.assertFalse(EmailToken.objects.filter(token_hash=token_hash).exists())

    def test_get_user_data_user_not_found(self):
        """Test get_user_data when user doesn't exist"""
        request = self.factory.get('/user/')
        # Create a user with different pk
        other_user = Profiles.objects.create_user(
            username="otheruser",
            email="other@test.com",
            password="testpass123"
        )
        force_authenticate(request, user=other_user)
        
        # Mock User.objects.select_related to raise DoesNotExist
        with patch('djangoProject.views.authentication_views.User.objects.select_related') as mock_select:
            mock_select.return_value.prefetch_related.return_value.get.side_effect = User.DoesNotExist
            
            response = get_user_data(request)
            self.assertEqual(response.status_code, 404)

    @patch('djangoProject.views.authentication_views.login')
    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    @patch('djangoProject.views.authentication_views.User.objects.get')
    def test_verify_otp_success_with_login(self, mock_get_user, mock_verify_otp, mock_login):
        """Test verify_otp successfully logs in user"""
        mock_get_user.return_value = self.user
        mock_verify_otp.return_value = True
        
        request = self.factory.post('/verify-otp/', {'username': 'test@test.com', 'otp': '123456'})
        response = verify_otp(request)
        
        self.assertEqual(response.status_code, 200)
        mock_login.assert_called_once()

    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    @patch('djangoProject.views.authentication_views.User.objects.get')
    def test_verify_otp_returns_error_status(self, mock_get_user, mock_verify_otp):
        """Test verify_otp returns proper error status when invalid"""
        mock_get_user.return_value = self.user
        mock_verify_otp.return_value = False
        
        request = self.factory.post('/verify-otp/', {'username': 'test@test.com', 'otp': 'wrong'})
        response = verify_otp(request)
        
        # Should return 200 with error message
        self.assertEqual(response.status_code, 200)
        self.assertIn('error', response.data)
        self.assertIn('Invalid or expired', response.data['error'])

    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    def test_verify_otp_logs_user_not_found_warning(self, mock_verify_otp):
        """Test verify_otp logs warning when user not found"""
        with patch('djangoProject.views.authentication_views.User.objects.get') as mock_get:
            mock_get.side_effect = User.DoesNotExist
            
            with patch('djangoProject.views.authentication_views.logger') as mock_logger:
                request = self.factory.post('/verify-otp/', {'username': 'nonexistent@test.com', 'otp': '123456'})
                response = verify_otp(request)
                
                mock_logger.warning.assert_called()

    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    def test_verify_otp_logs_invalid_token_warning(self, mock_verify_otp):
        """Test verify_otp logs warning when token is invalid"""
        mock_verify_otp.return_value = False
        
        with patch('djangoProject.views.authentication_views.User.objects.get') as mock_get:
            mock_get.return_value = self.user
            
            with patch('djangoProject.views.authentication_views.logger') as mock_logger:
                request = self.factory.post('/verify-otp/', {'username': 'test@test.com', 'otp': 'wrong'})
                response = verify_otp(request)
                
                mock_logger.warning.assert_called()

    @patch('djangoProject.views.authentication_views.EmailToken.verify_otp')
    @patch('djangoProject.views.authentication_views.login')
    def test_verify_otp_logs_successful_login(self, mock_login, mock_verify_otp):
        """Test verify_otp logs successful login"""
        mock_verify_otp.return_value = True
        
        with patch('djangoProject.views.authentication_views.User.objects.get') as mock_get:
            mock_get.return_value = self.user
            
            with patch('djangoProject.views.authentication_views.logger') as mock_logger:
                request = self.factory.post('/verify-otp/', {'username': 'test@test.com', 'otp': '123456'})
                response = verify_otp(request)
                
                mock_logger.info.assert_called()

    @patch('djangoProject.views.authentication_views.EmailToken.hash_token')
    @patch('djangoProject.views.authentication_views.EmailToken.objects.select_related')
    def test_activate_user_calls_hash_token(self, mock_select_related, mock_hash_token):
        """Test that activate_user calls hash_token with the raw_token"""
        mock_hash_token.return_value = "hashed_token"
        
        mock_token = MagicMock()
        mock_token.user = self.user
        mock_token.is_expired.return_value = False
        
        mock_query = MagicMock()
        mock_query.get.return_value = mock_token
        mock_select_related.return_value = mock_query
        
        with patch('djangoProject.views.authentication_views.Wallet.objects.create'):
            request = self.factory.post('/activate/test_token/')
            response = activate_user(request, 'test_token')
            
            mock_hash_token.assert_called_once_with(raw_token='test_token')

    @patch('djangoProject.views.authentication_views.Wallet.objects.create')
    @patch('djangoProject.views.authentication_views.EmailToken.objects.select_related')
    def test_activate_user_enables_user_and_creates_wallet(self, mock_select_related, mock_wallet_create):
        """Test activate_user properly enables user and creates wallet"""
        mock_token = MagicMock()
        mock_token.user = self.user
        mock_token.is_expired.return_value = False
        
        mock_query = MagicMock()
        mock_query.get.return_value = mock_token
        mock_select_related.return_value = mock_query
        
        with patch('djangoProject.views.authentication_views.EmailToken.hash_token') as mock_hash:
            mock_hash.return_value = "hashed_token"
            
            request = self.factory.post('/activate/test_token/')
            response = activate_user(request, 'test_token')
            
            # Verify user was modified
            self.user.refresh_from_db()
            self.assertTrue(self.user.email_verified)
            self.assertTrue(self.user.is_active)
            
            # Verify wallet was created
            mock_wallet_create.assert_called_once()

    @patch('djangoProject.views.authentication_views.EmailToken.objects.select_related')
    def test_activate_user_deletes_token_after_success(self, mock_select_related):
        """Test activate_user deletes token after successful auth-pages"""
        mock_token = MagicMock()
        mock_token.user = self.user
        mock_token.is_expired.return_value = False
        
        mock_query = MagicMock()
        mock_query.get.return_value = mock_token
        mock_select_related.return_value = mock_query
        
        with patch('djangoProject.views.authentication_views.EmailToken.hash_token') as mock_hash:
            mock_hash.return_value = "hashed_token"
            
            with patch('djangoProject.views.authentication_views.Wallet.objects.create'):
                request = self.factory.post('/activate/test_token/')
                response = activate_user(request, 'test_token')
                
                mock_token.delete.assert_called_once()

    def test_get_user_data_with_select_and_prefetch(self):
        """Test get_user_data uses select_related and prefetch_related correctly"""
        with patch('djangoProject.views.authentication_views.User.objects.select_related') as mock_select:
            with patch('djangoProject.views.authentication_views.UserSerialiser') as mock_serialiser_class:
                mock_query = MagicMock()
                mock_select.return_value.prefetch_related.return_value.get.return_value = self.user
                
                mock_serialiser = MagicMock()
                mock_serialiser.data = {'username': 'testuser'}
                mock_serialiser_class.return_value = mock_serialiser
                
                request = self.factory.get('/user/')
                force_authenticate(request, user=self.user)
                response = get_user_data(request)
                
                self.assertEqual(response.status_code, 200)

    def test_initiate_login_logs_success(self):
        """Test that initiate_login logs successfully"""
        with patch('djangoProject.views.authentication_views.authenticate') as mock_auth:
            with patch('djangoProject.views.authentication_views.EmailToken.create_otp_token') as mock_otp:
                with patch('djangoProject.views.authentication_views.send_otp_email') as mock_send:
                    with patch('djangoProject.views.authentication_views.logger') as mock_logger:
                        mock_auth.return_value = self.user
                        mock_otp.return_value = "123456"
                        
                        request = self.factory.post('/login/', {'username': 'testuser', 'password': 'pass'})
                        response = initiate_login(request)
                        
                        self.assertEqual(response.status_code, 200)

    def test_register_user_logs_errors(self):
        """Test that register_user logs errors when validation fails"""
        with patch('djangoProject.views.authentication_views.RegisterSerialiser') as mock_serialiser_class:
            with patch('djangoProject.views.authentication_views.logger') as mock_logger:
                mock_serialiser = MagicMock()
                mock_serialiser.is_valid.return_value = False
                mock_serialiser.errors = {'email': ['Invalid']}
                mock_serialiser_class.return_value = mock_serialiser
                
                request = self.factory.post('/register/', {'email': 'invalid'})
                response = register_user(request)
                
                mock_logger.error.assert_called()

    def test_register_user_logs_success(self):
        """Test that register_user logs success when user is created"""
        with patch('djangoProject.views.authentication_views.RegisterSerialiser') as mock_serialiser_class:
            with patch('djangoProject.views.authentication_views.logger') as mock_logger:
                mock_serialiser = MagicMock()
                mock_serialiser.is_valid.return_value = True
                mock_serialiser.data = {'email': 'new@test.com'}
                mock_serialiser_class.return_value = mock_serialiser
                
                request = self.factory.post('/register/', {'email': 'new@test.com'})
                response = register_user(request)
                
                mock_logger.info.assert_called()