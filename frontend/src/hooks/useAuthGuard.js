import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth-pages/authentication_context';

/**
 * Enforces authentication, redirecting unauthenticated users to login.
 * @returns {{ isAuthenticated: boolean, isLoading: boolean, logout: function(): void }} Current auth state.
 */
export const useAuthGuard = () => {
  const { isAuthenticated, loading: isLoading = false, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  return { isAuthenticated, isLoading, logout };
};