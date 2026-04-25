import { useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth-pages/authentication_context';

/**
 * Enforces authentication requirement for the consuming component.
 * Redirects to /login if the user is not authenticated.
 * @returns {{ isAuthenticated: boolean, isLoading: boolean, redirectIfUnauthorized: Function }}
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading = false } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectToLogin = useCallback(() => {
    navigate('/login', { state: { from: location }, replace: true });
  }, [navigate, location]);

  useEffect(() => {
    // Fix: use !isAuthenticated instead of === false,
    // so null/undefined also triggers the redirect
    if (!isLoading && !isAuthenticated) {
      redirectToLogin();
    }
  }, [isAuthenticated, isLoading, redirectToLogin]);

  return { isAuthenticated, isLoading, redirectToLogin };
};