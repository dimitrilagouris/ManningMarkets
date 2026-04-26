import React, { useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

import './login.css';
import '../../styles/base.css';
import '../otp/OtpModal.css';

import { DJANGO_API_BASE } from '../../config';
import { AuthContext } from '../../auth-pages/authentication_context';
import OtpModal from '../../components/modals/OtpModal';

import { Button } from '../../components/buttons/Button';
import { FormInput } from '../../components/forms/FormInput';

/**
 * Authenticates the user with the backend API.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<{ok: boolean, data: Object}>} The API response payload.
 */
async function authenticateUser(email, password) {
  const response = await fetch(`${DJANGO_API_BASE}/login/`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": Cookies.get("csrftoken"),
    },
    body: JSON.stringify({ username: email, password }),
  });

  const data = await response.json();
  return { ok: response.ok, data };
}

/**
 * Renders the login page to authenticate users or staff.
 * @returns {React.JSX.Element} The login page component.
 */
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { checkAuthStatus } = useContext(AuthContext);

  const activationMessage = location.state?.message;

  /**
   * Handles the form submission to authenticate the user.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const onSubmit = async (e) => {
    e.preventDefault();
    if (loginLoading) return;

    setLoginError(null);
    setLoginLoading(true);

    try {
      const { ok, data } = await authenticateUser(email, password);

      if (ok) {
        if (data.two_factor_required) {
          setOtpEmail(email);
          setShowOtpModal(true);
        } else {
          await checkAuthStatus();
          navigate('/markets');
        }
      } else {
        setLoginError(data.error || "Login failed.");
      }
    } catch (err) {
      setLoginError("An error occurred during login.");
    } finally {
      setLoginLoading(false);
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

          {activationMessage && (
            <div className="login-info" role="status">{activationMessage}</div>
          )}

          <form className="login-list" onSubmit={onSubmit}>
            <FormInput
              type="email"
              label="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fill="white"
              icon={<FontAwesomeIcon icon={faEnvelope} />}
              fullWidth
            />

            <FormInput
              type="password"
              label="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fill="white"
              icon={<FontAwesomeIcon icon={faLock} />}
              fullWidth
            />

            <Button fill="primary" width="full">
              {loginLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          {loginError && <div className="login-error" role="alert">{loginError}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <Button
              fill="link"
              textColor="primary"
              onClick={() => navigate('/sign-up')}
              height="short"
            >
              Sign Up
            </Button>
          </div>

        </div>
      </aside>

      {showOtpModal && (
        <OtpModal
          email={otpEmail}
          onClose={() => setShowOtpModal(false)}
          onSuccess={async () => {
            try {
              await checkAuthStatus();
            } catch (err) {
              // Intentional fallback or silent fail
            }
            setShowOtpModal(false);
            navigate('/markets');
          }}
        />
      )}
    </div>
  );
}

export default LoginPage;