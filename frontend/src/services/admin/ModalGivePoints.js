import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faTimes } from '@fortawesome/free-solid-svg-icons';

/**
 * @typedef {Object} User
 * @property {string|number} id
 * @property {string} name
 * @property {string} email
 */

/**
 * Modal to assign a specified number of points to a user.
 * @param {Object} props
 * @param {boolean} props.show
 * @param {User} [props.user]
 * @param {function(): void} props.onClose
 * @param {function(number): void} props.onConfirm
 * @returns {JSX.Element|null}
 */
export const ModalGivePoints = ({ show, user, onClose, onConfirm }) => {
  const [points, setPoints] = useState('');

  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Clear stale input data between modal renders
  useEffect(() => {
    if (show) setPoints('');
  }, [show]);

  if (!show || !user) return null;

  /** @param {React.FormEvent} e */
  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(points, 10);
    if (!isNaN(amount) && amount > 0) {
      onConfirm(amount);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="points-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content" role="document" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h1 id="points-modal-title">
          <FontAwesomeIcon icon={faCoins} /> Give Points
        </h1>

        <p>Assign additional points to <strong>{user.name}</strong>.</p>

        <form onSubmit={handleSubmit} className="otp-form">
          <label className="otp-label" htmlFor="points-input">Amount</label>
          <input
            id="points-input"
            type="number"
            min="1"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            className="otp-input"
          />

          <div className="otp-actions">
            <button type="submit" className="login-cta" disabled={!points || points <= 0}>
              Confirm
            </button>
            <button type="button" className="signup-cta" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ModalGivePoints.propTypes = {
  show: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};