import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
 * Returns ok flag and parsed response body.
 */
async function registerUser(username, email, password) {
  const response = await fetch(`${DJANGO_API_BASE}/register/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken') ?? '',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,}).*$/;

/**
 * Derives a human-readable validation error from the current field values.
 * Returns null when the form is fully valid.
 */
function getValidationError(username, email, password, confirmPassword) {
  if (username.trim() === '') return 'Username is required.';
  if (!email.endsWith('@uni.sydney.edu.au')) return 'Email must be a @uni.sydney.edu.au address.';
  if (!PASSWORD_REGEX.test(password))
    return 'Password must be 8+ characters with a number and special character.';
  if (password !== confirmPassword || password === '') return 'Passwords do not match.';
  return null;
}

/**
 * Sign-up page for new ManningMarkets users.
 * Handles validation, submission, and navigation on success.
 */
function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validationError = getValidationError(username, email, password, confirmPassword);
  const isFormValid = validationError === null;

  const displayedError = touched && validationError ? validationError : '\u200b';

  const markTouched = () => {
    if (!touched) setTouched(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setLoading(true);

    try {
      const { ok, data } = await registerUser(username, email, password);

      if (ok) {
        navigate('/login', { state: { message: 'Check your email to activate your account!' } });
      } else {
        const firstError = Object.values(data).flat()[0] ?? 'Registration failed.';
        setSubmitError(firstError);
      }
    } catch {
      setSubmitError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      {/* Left: hero panel */}
      <div className="signup-hero" role="img" aria-label="University campus hero image">
        <div className="signup-hero__overlay" />
        <div className="signup-hero__content">
          <span className="signup-hero__eyebrow">University of Sydney</span>
          <h1 className="signup-hero__title">Manning<br />Markets</h1>
          <div className="signup-panel__rule" aria-hidden="true" />
          <p className="signup-hero__tagline">Prediction markets for the university community.</p>

        </div>
      </div>

      {/* Right: form panel */}
      <aside className="signup-panel" aria-labelledby="signup-heading">
        <div className="signup-panel__inner">
          <div className="signup-panel__header">
            <h2 id="signup-heading" className="signup-panel__title">Create account</h2>
            <p className="signup-panel__lead">
              Use your University of Sydney email to get started.
            </p>
          </div>

          <form className="signup-form" onSubmit={onSubmit} noValidate>
            <div className="signup-form__fields">
              <FormInput
                type="text"
                label="Username"
                value={username}
                onChange={e => { setUsername(e.target.value); markTouched(); }}
                icon={<FontAwesomeIcon icon={faUser} />}
                fullWidth
              />

              <FormInput
                type="email"
                label="Email"
                value={email}
                onChange={e => { setEmail(e.target.value); markTouched(); }}
                icon={<FontAwesomeIcon icon={faEnvelope} />}
                fullWidth
              />

              <FormInput
                type="password"
                label="Password"
                value={password}
                onChange={e => { setPassword(e.target.value); markTouched(); }}
                icon={<FontAwesomeIcon icon={faLock} />}
                fullWidth
              />

              <FormInput
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); markTouched(); }}
                icon={<FontAwesomeIcon icon={faLock} />}
                fullWidth
              />
            </div>

            <p className="signup-form__validation" aria-live="polite">
              {displayedError}
            </p>

            <Button
              fill="primary"
              width="full"
              height="medium"
              disabled={!isFormValid || loading}
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>

            {submitError && (
              <p className="signup-form__submit-error" role="alert">
                {submitError}
              </p>
            )}
          </form>

          <div className="signup-panel__footer">
            <span className="signup-panel__footer-text">Already have an account?</span>
            <Button
              fill="link"
              textColor="primary"
              height="short"
              onClick={() => navigate('/login')}
            >
              Log in
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default SignUp;