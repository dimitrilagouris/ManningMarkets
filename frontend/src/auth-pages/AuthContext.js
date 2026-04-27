import React, { createContext, useEffect, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import clientApi from '../api/clientApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // useCallback ensures this function reference never changes, preventing infinite loops
    const checkAuthStatus = useCallback(async () => {
        try {
            const { data } = await clientApi.get('/user/');
            setIsAuthenticated(true);
            setIsAdmin(data.is_admin || false);
            setUser(data);
        } catch (err) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const contextData = {
        isAuthenticated, setIsAuthenticated,
        isAdmin,
        user, setUser,
        loading,
        checkAuthStatus,
        logout,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <div>Loading...</div> : children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};