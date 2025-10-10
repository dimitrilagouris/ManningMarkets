import React, { useContext } from 'react';

import { useNavigate } from "react-router-dom";
import { DJANGO_API_BASE } from "../config";
import { getCSRFToken } from "../session_management/csrfToken";
import { AuthContext } from "../session_management/authentication_context";

function LogoutButton() {
    const navigate = useNavigate();
    const { checkAuthStatus }  = useContext(AuthContext);

    const logout = async () => {
        try {
            const csrfToken = await getCSRFToken();
            console.log(csrfToken);

            const res = await fetch(`${DJANGO_API_BASE}/logout/`, {
                method: 'POST',
                credentials: 'include',
                headers:
                {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrfToken,
                },
            })

            if (res.ok) {
                console.log("Logout successful");
                await checkAuthStatus();
                navigate("/");
            }
            else {
                console.error("logout failed");
            }
        }
        catch (err) {
            console.error("Error logging out: ", err);
        }
    }
    return (
        <button onClick={logout}>
            Logout
        </button>
    );
}

export default LogoutButton;