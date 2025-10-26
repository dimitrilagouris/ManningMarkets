import json
import re
from decimal import Decimal
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from unittest.mock import patch, MagicMock

from ..views.user_views import (
get_wallet,
get_profile,
change_username,
change_password,
)
from ..models import Profiles, Wallet

class ProfileAndWalletViewsTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Mock authenticated user
        self.user = MagicMock()
        self.user.pk = 1
        self.user.username = "old_user"
        self.user.check_password = MagicMock(return_value=True)
        self.user.set_password = MagicMock()
        self.user.save = MagicMock()

    @patch("djangoProject.views.user_views.Wallet.objects.get")
    def test_get_wallet_success(self, mock_get):
        mock_wallet = MagicMock()
        mock_wallet.id = 1
        mock_wallet.points_balance = Decimal("100.00")
        mock_get.return_value = mock_wallet

        request = self.factory.get("/get_wallet")
        force_authenticate(request, user=self.user)

        response = get_wallet(request)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.render().content)
        self.assertEqual(data["wallet_id"], 1)
        self.assertEqual(float(data["balance"]), 100.00)

    @patch("djangoProject.views.user_views.Wallet.objects.get", side_effect=Wallet.DoesNotExist)
    def test_get_wallet_not_found(self, mock_get):
        request = self.factory.get("/get_wallet")
        force_authenticate(request, user=self.user)
        response = get_wallet(request)
        self.assertEqual(response.status_code, 404)
        self.assertIn("Wallet could not be found", response.data["error"])

    @patch("djangoProject.views.user_views.Profiles.objects.select_related")
    def test_get_profile_success(self, mock_select_related):
        mock_role = MagicMock()
        mock_role.role_name = "Admin"

        mock_user = MagicMock()
        mock_user.username = "testuser"
        mock_user.role = mock_role
        mock_user.email = "test@uni.sydney.edu.au"
        mock_user.date_joined = "2025-01-01"
        mock_user.last_login = "2025-02-01"

        mock_select_related.return_value.get.return_value = mock_user

        request = self.factory.get("/get_profile")
        force_authenticate(request, user=self.user)

        response = get_profile(request)
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.render().content)
        self.assertEqual(data["username"], "testuser")
        self.assertEqual(data["role"], "Admin")

    @patch("djangoProject.views.user_views.Profiles.objects.select_related")
    def test_get_profile_not_found(self, mock_select_related):
        mock_select_related.return_value.get.side_effect = Profiles.DoesNotExist
        request = self.factory.get("/get_profile")
        force_authenticate(request, user=self.user)
        response = get_profile(request)
        self.assertEqual(response.status_code, 404)
        self.assertIn("User does not exst", response.data["error"])

    @patch("djangoProject.views.user_views.Profiles.objects.select_related")
    def test_change_username_success(self, mock_select_related):
        mock_user = MagicMock()
        mock_user.username = "old_user"
        mock_user.save = MagicMock()
        mock_select_related.return_value.get.return_value = mock_user

        request = self.factory.post("/change_username", {"newUsername": "new_user"}, format="json")
        force_authenticate(request, user=self.user)

        response = change_username(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn("successfully", response.data["message"])

    def test_change_username_missing_field(self):
        request = self.factory.post("/change_username", {}, format="json")
        force_authenticate(request, user=self.user)
        response = change_username(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.data["error"])

    @patch("djangoProject.views.user_views.Profiles.objects.select_related")
    def test_change_username_user_not_found(self, mock_select_related):
        mock_select_related.return_value.get.side_effect = Profiles.DoesNotExist
        request = self.factory.post("/change_username", {"newUsername": "new_user"}, format="json")
        force_authenticate(request, user=self.user)
        response = change_username(request)
        self.assertEqual(response.status_code, 404)
        self.assertIn("does not exist", response.data["error"])

    @patch("djangoProject.views.user_views.update_session_auth_hash")
    def test_change_password_success(self, mock_update_hash):
        valid_pw = "Newpass1!"
        request = self.factory.post(
            "/change_password", {"oldPassword": "oldpass", "newPassword": valid_pw}, format="json"
        )
        force_authenticate(request, user=self.user)
        response = change_password(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Password changed successfully", response.data["message"])
        self.user.set_password.assert_called_once_with(valid_pw)
        mock_update_hash.assert_called_once()

    def test_change_password_missing_fields(self):
        request = self.factory.post("/change_password", {}, format="json")
        force_authenticate(request, user=self.user)
        response = change_password(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("required", response.data["error"])

    def test_change_password_incorrect_old_password(self):
        self.user.check_password.return_value = False
        request = self.factory.post(
            "/change_password", {"oldPassword": "wrong", "newPassword": "Newpass1!"}, format="json"
        )
        force_authenticate(request, user=self.user)
        response = change_password(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Old password is incorrect", response.data["error"])

    def test_change_password_too_short(self):
        request = self.factory.post(
            "/change_password", {"oldPassword": "oldpass", "newPassword": "Ab1!"}, format="json"
        )
        force_authenticate(request, user=self.user)
        response = change_password(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("at least 8 characters", response.data["error"])

    def test_change_password_missing_number(self):
        request = self.factory.post(
            "/change_password", {"oldPassword": "oldpass", "newPassword": "Password!"}, format="json"
        )
        force_authenticate(request, user=self.user)
        response = change_password(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("at least one number", response.data["error"])

    def test_change_password_missing_special(self):
        request = self.factory.post(
            "/change_password", {"oldPassword": "oldpass", "newPassword": "Password1"}, format="json"
        )
        force_authenticate(request, user=self.user)
        response = change_password(request)
        self.assertEqual(response.status_code, 400)
        self.assertIn("at least one special", response.data["error"])