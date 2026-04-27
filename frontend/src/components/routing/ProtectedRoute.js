import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthContext } from '../../auth-pages/AuthContext';
import Loading from '../common/Loading';

/**
 * Restricts route access to authenticated users.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return <Loading />;

    if (!isAuthenticated) {
        // Pass pathname as a string to avoid object reference loops
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    return children;
}

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
};