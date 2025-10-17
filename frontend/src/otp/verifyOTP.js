import React, { useContext, useState } from 'react';

import { DJANGO_API_BASE } from '../config';
import Cookies from 'js-cookie';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../session_management/authentication_context';

function VerifyOTP() {
    const [otp, setOtp] = useState('')
    const location = useLocation()
    const navigate = useNavigate()
    const email = location.state?.email
    const { checkAuthStatus }  = useContext(AuthContext);
    
    const onSubmit = async e => {
        e.preventDefault()

        const res = await fetch(`${DJANGO_API_BASE}/verify-otp/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": Cookies.get("csrftoken"),
            },
            body: JSON.stringify({ username: email, otp: otp}),
        });

        const data = await res.json();
        if (res.ok) {
            await checkAuthStatus();
            navigate("/markets");
        }
        else {
            alert(data.error || "OTP verification failed");
        }
    };

    return (
        <form onSubmit={onSubmit}>
            <label>Enter OTP</label>
            <input value={otp} onChange={e => setOtp(e.target.value)} required />
            <button type="submit">Verify</button>
        </form>
    );
}

export default VerifyOTP;