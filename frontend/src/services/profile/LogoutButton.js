import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

import { DJANGO_API_BASE } from '../../config';
import { AuthContext } from '../../auth-pages/authentication_context';
import { Button } from '../../components/buttons/Button';

import '../login/login.css';

/**
 * Renders a full-width primary button that handles user logout.
 * Clears the session and redirects to the home page upon success.
 * @returns {JSX.Element}
 */
const LogoutButton = () => {
  const navigate = useNavigate();
  const { checkAuthStatus } = useContext(AuthContext);

  /**
   * Submits the logout request to the API and updates auth state.
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      const res = await fetch(`${DJANGO_API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken') || '',
        },
      });

      if (res.ok) {
        await checkAuthStatus();
        navigate('/');
      }
    } catch (err) {
      // Intentional silence: a network failure during logout should not crash the UI
    }
  };

  return (
    <Button fill="primary" width="full" onClick={logout}>
      Logout
    </Button>
  );
};

export default LogoutButton;