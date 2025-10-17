// sign_up.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import './signUp.css';
import '../base.css';

import { Link, useNavigate } from 'react-router-dom';

import { DJANGO_API_BASE } from '../config';
import Cookies from 'js-cookie';

function SignUp() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm_password, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async e => {
    e.preventDefault();
    try {


      const res = await fetch(`${DJANGO_API_BASE}/register/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get("csrftoken"),
        },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok)
      {
        alert('Check your email to activate your account!')

        navigate("/login");

      }
      else 
      {
        alert(JSON.stringify(data))
      }
    }
    catch(err) {
      console.error(err);
      alert('Something went wrong.');
    }
  };

  const validUsername = username.trim() !== '';
  const validEmail = email.endsWith('@uni.sydney.edu.au');
  const passwordRegex = /^(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/;
  const validPassword = passwordRegex.test(password);
  const passwordMatch = password === confirm_password;
  
  const validForm = validUsername && validEmail && validPassword && passwordMatch;

  // user guidance messages
  let errorMessage = '\u200b'; // invisible character as to not effect spacing
  if (touched)
  {
    if (!validUsername) 
    {
        errorMessage = 'Username is required.';
    }
    else if (!validEmail)
    {
        errorMessage = 'Email must be a @uni.sydney.edu.au address.';
    }
    else if (!validPassword)
    {
        errorMessage = 'Password must be at least 8 characters, contain a number and a special character.';
    }
    else if (!passwordMatch)
    {
        errorMessage = 'Passwords do not match.';
    }
  }

  return (
    <div className="sign_up-page">
      <div className="top-band" aria-hidden="true" />

      <div className="sign_up-image" role="img" aria-label="hero image" />

      <aside className="sign_up-side" aria-labelledby="sign_up-heading">
        <div className="sign_up-side__content">
          <h2 id="sign_up-heading" className="sign_up-side__title">Welcome.</h2>
          <p className="sign_up-side__lead">
                Sign Up to access ManningMarkets.
          </p>

          <form className="sign_up-list" onSubmit={onSubmit}>

            <label className="sign_up-list__item sign_up-field" htmlFor="username">
              <div className="sign_up-list__label">
                <span>Username</span>
              </div>
              <div className="sign_up-field__control">
                <FontAwesomeIcon icon={faUser} className="field-icon" />
                <input
                  id="username"
                  type="username"
                  value={username}
                  onChange={e => {
                    setUsername(e.target.value);
                    setTouched(true);
                  }}
                  required
                />
              </div>
            </label>


            <label className="sign_up-list__item sign_up-field" htmlFor="email">
              <div className="sign_up-list__label">
                <span>Email</span>
              </div>
              <div className="sign_up-field__control">
                <FontAwesomeIcon icon={faEnvelope} className="field-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setTouched(true);
                }}
                  required
                />
              </div>
            </label>

            <label className="sign_up-list__item sign_up-field" htmlFor="password">
              <div className="sign_up-list__label">
                <span>Password</span>
              </div>
              <div className="sign_up-field__control">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setTouched(true);
                }}
                  required
                />
              </div>
            </label>

            <label className="sign_up-list__item sign_up-field" htmlFor="confirm_password">
              <div className="sign_up-list__label">
                <span>Confirm Password</span>
              </div>
              <div className="sign_up-field__control">
                <FontAwesomeIcon icon={faLock} className="field-icon" />
                <input
                  id="confirm_password"
                  type="password"
                  value={confirm_password}
                  onChange={e => {
                    setConfirmPassword(e.target.value);
                    setTouched(true);
                }}
                  required
                />
              </div>
            </label>

            <p className="info-text">{errorMessage}</p>
            
            <button type="submit" className="sign_up-cta" disabled={!validForm}>Sign Up</button>
          </form>
          <Link className="info-link" to="/login">Login here.</Link>
        </div>
      </aside>
    </div>
  );
}

export default SignUp;
