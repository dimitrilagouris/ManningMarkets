import { useEffect, useState } from 'react';

import { DJANGO_API_BASE } from '../config';
import Cookies from 'js-cookie';

import './login.css'

function ChangePassword() {

    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [touched, setTouched] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const onSubmit = async e => {
        e.preventDefault();

        try {

            const res = await fetch(`${DJANGO_API_BASE}/change-password/`, {
                method: "POST",
                credentials: "include",
                headers:
                {
                    "Content-Type": "application/json",
                    "X-CSRFToken": Cookies.get("csrftoken"),
                },
                body: JSON.stringify({
                newPassword: newPassword,
                oldPassword: oldPassword,
                }),
            });

            const data = await res.json();

            if (res.ok)
            {
                console.log("Password change successful", data);
                setErrorMessage("Password change successful.");
                setNewPassword('');
                setConfirmNewPassword('');
                setOldPassword('');
                setTouched(false);
                
                setTimeout(() => setErrorMessage(""), 50000)
            }
            else 
            {
                setErrorMessage(data.error || "Password change failed.");
            }
        }
        catch (err) {
            console.error("Password change error: ", err)
        }
    };

    const passwordRegex = /^(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/;
    const validPassword = passwordRegex.test(newPassword);
    const passwordMatch = newPassword === confirmNewPassword;
    const oldPasswordNotEmpty = oldPassword && oldPassword.length > 0;

    const validForm = validPassword && passwordMatch && oldPasswordNotEmpty;

    useEffect(() => {
      if (!oldPasswordNotEmpty && touched)
      {
        setErrorMessage("Old password must be filled in");
      }
      else if (!validPassword && touched) {
        setErrorMessage('Password must be at least 8 characters, contain a number and a special character.');
      }
      else if (!passwordMatch && touched) {
        setErrorMessage('Passwords do not match.');
      }
      else 
      {
        setErrorMessage("");
      }
    }, [oldPassword, newPassword, confirmNewPassword, touched, oldPasswordNotEmpty, passwordMatch, validPassword])



    return (

        <form onSubmit={onSubmit}>
              <label className="sign_up-list__item sign_up-field" htmlFor="password">
                <div className="sign_up-list__label">
                  <span>Old Password</span>
                </div>
                <div className="sign_up-field__control">
                  <input
                    id="old_password"
                    type="password"
                    value={oldPassword}
                    onChange={e => {
                      setOldPassword(e.target.value);
                      setTouched(true);
                  }}
                    required
                  />
                </div>
            </label>

            <label className="sign_up-list__item sign_up-field" htmlFor="password">
              <div className="sign_up-list__label">
                <span>New Password</span>
              </div>
              <div className="sign_up-field__control">
                <input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setTouched(true);
                }}
                  required
                />
              </div>
            </label>

            <label className="sign_up-list__item sign_up-field" htmlFor="confirm_password">
              <div className="sign_up-list__label">
                <span>Confirm New Password</span>
              </div>
              <div className="login-field__control">
                <input
                  id="confirm_password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={e => {
                    setConfirmNewPassword(e.target.value);
                    setTouched(true);
                }}
                  required
                />
              </div>
            </label>
            <p className="info-text">{errorMessage}</p>
            
            <button type="submit" className="signup-cta" disabled={!validForm}>Change Password</button>
        </form>
    );
}

export default ChangePassword;