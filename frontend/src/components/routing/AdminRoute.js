import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { AuthContext } from '../../auth-pages/AuthContext';
import Loading from '../common/Loading';

/**
 * Restricts route access to administrators.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export default function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin, loading } = useContext(AuthContext);
    const location = useLocation();

    if (loading) return <Loading />;

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }

    if (!isAdmin) {
        // Redirect standard users who try to access admin pages back to the home page
        return <Navigate to="/" replace />;
    }

    return children;
}

AdminRoute.propTypes = {
    children: PropTypes.node.isRequired,
};