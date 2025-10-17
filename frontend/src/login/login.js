// Login.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import './login.css';
import '../base.css';

import { DJANGO_API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const onSubmit = async e => {
    e.preventDefault();

    console.log("CSRF Token: ", Cookies.get("csrftoken"));

    try {
      const res = await fetch(`${DJANGO_API_BASE}/login/`, {
        method: "POST",
        credentials: "include",
        headers:
        {
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken"),
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("Login successful", data);
        navigate("/verify-otp", {state: { email }});
      }
      else 
      {
        alert(data.error || "Login failed.");
      }
    }
    catch(err)
    {
      console.error("Login error: ", err);
      alert("Error occured during login");
    }
  };

  return (
    <div className="login-page">
      <div className="top-band" aria-hidden="true" />

      <div className="login-image" role="img" aria-label="hero image" />

      <aside className="login-side" aria-labelledby="login-heading">
        <div className="login-side__content">
          <h2 id="login-heading" className="login-side__title">Welcome back</h2>
          <p className="login-side__lead">
            Whether you are a student, staff member or external partner, sign in to access your markets.
          </p>

          <form className="login-list" onSubmit={onSubmit}>
            <label className="login-list__item login-field" htmlFor="email">
              <div className="login-list__label">
                <span>Email</span>
              </div>
              <div className="login-field__control">
                <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </label>

            <label className="login-list__item login-field" htmlFor="password">
              <div className="login-list__label">
                <span>Password</span>
              </div>
              <div className="login-field__control">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </label>

            <button type="submit" className="login-cta">Log In</button>
          </form>
            <button className="signup-cta">Sign Up</button>

          <a className="info-link" href="#partner">Forgot password?</a>
        </div>
      </aside>
    </div>
  );
}

export default Login;
