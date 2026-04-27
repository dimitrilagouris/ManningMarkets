import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

import './SignUp.css';
import '../../styles/base.css';
import { DJANGO_API_BASE } from '../../config';

import { Button } from '../../components/buttons/Button';
import { FormInput } from '../../components/forms/FormInput';

/**
 * Registers a new user with the backend API.
 * @param {string} username - The chosen username.
 * @param {string} email - The user's university email address.
 * @param {string} password - The chosen password.
 * @returns {Promise<{ok: boolean, data: Object}>} The API response payload.
 */
async function registerUser(username, email, password) {
  const response = await fetch(`${DJANGO_API_BASE}/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get("csrftoken"),
    },
    body: JSON.stringify({ username, email, password })
  });
  
  const data = await response.json();
  return { ok: response.ok, data };
}

/**
 * Renders the sign-up page for new users.
 * @returns {React.JSX.Element} The sign-up page component.
 */
function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const validUsername = username.trim() !== '';
  const validEmail = email.endsWith('@uni.sydney.edu.au');
  const passwordRegex = /^(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/;
  const validPassword = passwordRegex.test(password);
  const passwordMatch = password === confirmPassword && password !== '';
  
  const validForm = validUsername && validEmail && validPassword && passwordMatch;

  let errorMessage = '\u200b'; 
  if (touched) {
    if (!validUsername) {
      errorMessage = 'Username is required.';
    } else if (!validEmail) {
      errorMessage = 'Email must be a @uni.sydney.edu.au address.';
    } else if (!validPassword) {
      errorMessage = 'Password must be at least 8 characters, contain a number and a special character.';
    } else if (!passwordMatch) {
      errorMessage = 'Passwords do not match.';
    }
  }

  /**
   * Handles the form submission to register the user.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);

    try {
      const { ok, data } = await registerUser(username, email, password);

      if (ok) {
        navigate("/login", { state: { message: "Check your email to activate your account!" } });
      } else {
        const firstError = Object.values(data).flat()[0] ?? "RegisterPage failed.";
        setSubmitError(firstError);
      }
    } catch (err) {
      setSubmitError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <FormInput
              type="text"
              label="Username"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                setTouched(true);
              }}
              icon={<FontAwesomeIcon icon={faUser} />}
              fullWidth
            />

            <FormInput
              type="email"
              label="Email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setTouched(true);
              }}
              icon={<FontAwesomeIcon icon={faEnvelope} />}
              fullWidth
            />

            <FormInput
              type="password"
              label="Password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setTouched(true);
              }}
              icon={<FontAwesomeIcon icon={faLock} />}
              fullWidth
            />

            <FormInput
              type="password"
              label="Confirm Password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                setTouched(true);
              }}
              icon={<FontAwesomeIcon icon={faLock} />}
              fullWidth
            />

            <p className="info-text">{errorMessage}</p>
            
            <Button 
              fill="primary" 
              width="full" 
              disabled={!validForm || loading}
            >
              {loading ? 'Signing up...' : 'Sign Up'}
            </Button>

            {submitError && (
              <p className="info-text" role="alert" style={{ color: 'red' }}>{submitError}</p>
            )}
          </form>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              fill="link"
              textColor="primary"
              onClick={() => navigate('/login')}
              height={"short"}
            >
              Login here.
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default SignUp;