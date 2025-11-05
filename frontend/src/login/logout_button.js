import React, { useContext } from 'react';

import { useNavigate } from "react-router-dom";
import { DJANGO_API_BASE } from "../config";
import Cookies from 'js-cookie';
import { AuthContext } from "../session_management/authentication_context";

import './login.css'

function LogoutButton() {
    const navigate = useNavigate();
    const { checkAuthStatus }  = useContext(AuthContext);

    const logout = async () => {
        try {
            const res = await fetch(`${DJANGO_API_BASE}/logout/`, {
                method: 'POST',
                credentials: 'include',
                headers:
                {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken"),
                },
            })

            if (res.ok) {
                await checkAuthStatus();
                navigate("/");
            }
            else {
            }
        }
        catch (err) {
        }
    }
    return (
        <button onClick={logout} className='login-cta'>
            Logout
        </button>
    );
}

export default LogoutButton;