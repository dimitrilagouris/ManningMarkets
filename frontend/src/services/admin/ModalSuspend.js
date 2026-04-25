import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSlash, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

/**
 * @typedef {Object} User
 * @property {string|number} id
 * @property {string} name
 * @property {string} email
 */

/**
 * Renders a confirmation modal for suspending a user account.
 * @param {Object} props
 * @param {boolean} props.show
 * @param {User} [props.user]
 * @param {function(): void} props.onClose
 * @param {function(): void} props.onConfirm
 * @returns {JSX.Element|null}
 */
export const SuspendModal = ({ show, user, onClose, onConfirm }) => {
  useEffect(() => {
    /** @param {KeyboardEvent} e */
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!show || !user) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content modal-content--warning" role="document" onMouseDown={(e) => e.stopPropagation()}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        <h1 id="suspend-modal-title">
          <FontAwesomeIcon icon={faUserSlash} /> Suspend User
        </h1>

        <div className="modal-warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
          <p>Are you sure you want to suspend this user account?</p>
        </div>

        <div className="modal-user-info">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>

        <div className="otp-actions">
          <button type="button" className="login-cta" onClick={onConfirm}>
            Confirm Suspension
          </button>
          <button type="button" className="signup-cta" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

SuspendModal.propTypes = {
  show: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};