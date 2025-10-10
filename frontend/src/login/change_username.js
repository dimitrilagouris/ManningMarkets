import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DJANGO_API_BASE } from '../config';
import {getCSRFToken} from '../session_management/csrfToken';

function ChangeUsername() {

    const [newUsername, setNewUsername] = useState();
    const navigate = useNavigate();


    const onSubmit = async e => {
        e.preventDefault();

        try {
            const csrfToken = await getCSRFToken();
            console.log(csrfToken);

            const res = await fetch(`${DJANGO_API_BASE}/change_username/`, {
                method: "POST",
                credentials: "include",
                headers:
                {
                "Content-Type": "application/json",
                "X-CSRFToken": csrfToken,
                },
                body: JSON.stringify({
                username: newUsername,
                }),
            });

            const data = await res.json();

            if (res.ok)
            {
                console.log("Username change successful", data);
                navigate("/profile"); // force page reload
            }
            else 
            {
                alert(data.error || "Username change failed.");
            }
        }
        catch (err) {
            console.error("Username change error: ", err)
        }
    };

    return (

        <form onSubmit={onSubmit}>
            <input
                id="username"
                type="username"
                value={newUsername}
                onChange={e => {
                setNewUsername(e.target.value);
                }}
                required
            />
            <button type="submit" className="login-cta">Change Username</button>
        </form>
    );
}

export default ChangeUsername;