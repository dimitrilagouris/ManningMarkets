import { useState } from 'react';
import { DJANGO_API_BASE } from '../config';
import Cookies from 'js-cookie';

function ChangeUsername({ onUsernameChange }) {

    const [newUsername, setNewUsername] = useState("");


    const onSubmit = async e => {
        e.preventDefault();

        try {

            console.log("CSRF COOKIE: ", Cookies.get("csrftoken"));
            const res = await fetch(`${DJANGO_API_BASE}/change-username/`, {
                method: "POST",
                credentials: "include",
                headers:
                {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken"),
                },
                body: JSON.stringify({
                newUsername: newUsername,
                }),
            });

            const data = await res.json();

            if (res.ok)
            {
                console.log("Username change successful", data);

                if (onUsernameChange) {
                    onUsernameChange(newUsername);
                }

                setNewUsername('');
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
            <label className="sign_up-list__item sign_up-field" htmlFor="change_username">
              <div className="sign_up-list__label">
                <span>Change username</span>
              </div>
              <div className="login-field__control">
                <input
                  id="change_username"
                  type="text"
                  value={newUsername}
                  onChange={e => {
                    setNewUsername(e.target.value);
                }}
                  required
                />
              </div>
            </label>
            
            <button type="submit" className="signup-cta" >Change Username</button>
        </form>

    );
}

export default ChangeUsername;
