// VerifyOTP.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import { DJANGO_API_BASE } from '../config';
import { AuthContext } from '../session_management/authentication_context';

function VerifyOTP({ email, onClose, onSuccess }) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const otpInputRef = useRef(null);
  const { checkAuthStatus } = useContext(AuthContext);

  useEffect(() => {
    if (otpInputRef.current) otpInputRef.current.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitOtp = async (e) => {
    e && e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`${DJANGO_API_BASE}/verify-otp/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": Cookies.get("csrftoken"),
        },
        body: JSON.stringify({ username: email, otp: otp }),
      });

      const data = await res.json();

      if (res.ok) {
        // refresh auth via context if available then call onSuccess
        try {
          await checkAuthStatus();
        } catch (err) {
        }
        onSuccess && onSuccess();
      } else {
        setError(data.error || "OTP verification failed");
      }
    } catch (err) {
      setError("Network or server error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="otp-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="document" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h1 id="otp-modal-title">Enter One Time Passcode</h1>
        <p>We have sent a 6 digit code to <strong>{email}</strong>. Enter it below to complete sign in.</p>

        <form onSubmit={submitOtp} className="otp-form">
          <label className="otp-label" htmlFor="otp-input">One time passcode</label>
          <input
            id="otp-input"
            ref={otpInputRef}
            value={otp}
            onChange={e => setOtp(e.target.value)}
            inputMode="numeric"
            pattern="\d*"
            required
            className="otp-input"
            aria-describedby="otp-help"
          />
          <div id="otp-help" className="otp-help">Enter the 6 digit code you received</div>

          {error && <div className="otp-error" role="alert">{error}</div>}

          <div className="otp-actions">
            <button type="submit" className="login-cta" disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" className="signup-cta" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VerifyOTP;
