import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../auth-pages/authentication_context';

function ProtectedRoute({ children }) {
    const { isAuthenticated, isLoading = false } = useContext(AuthContext);
    const location = useLocation();

    if (isLoading) return <div className="main-content">Loading...</div>;
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

    return children;
}

export default ProtectedRoute;