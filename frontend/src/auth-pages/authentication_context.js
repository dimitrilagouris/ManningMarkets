import React, { createContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { DJANGO_API_BASE } from "../config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuthStatus = async () => {
        try {
            const res = await fetch(`${DJANGO_API_BASE}/user/`, {
                method: 'GET',
                credentials: 'include',
                headers: { "X-CSRFToken": Cookies.get("csrftoken") }
            });

            if (res.ok) {
                const userData = await res.json();
                setIsAuthenticated(true);
                setIsAdmin(userData.is_admin || false);
                setUser(userData);
            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
                setUser(null);
            }
        } catch (err) {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setUser(null);
    };

    useEffect(() => { checkAuthStatus(); }, []);

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