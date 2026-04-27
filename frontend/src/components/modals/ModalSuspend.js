import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserSlash, faUserCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../components/buttons/Button';
import './modals.css';

/**
 * Attaches an Escape key listener that calls onClose.
 * Re-usable across all modals.
 */
export const useEscapeKey = (onClose) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
};

/**
 * Confirmation modal for suspending or unsuspending a user account.
 *
 * @param {Object}   props
 * @param {boolean}  props.show      - Whether the modal is visible.
 * @param {Object}   props.user      - User object ({ id, name, email, status }).
 * @param {Function} props.onClose   - Called on cancel, backdrop click, or Escape.
 * @param {Function} props.onConfirm - Called when the user confirms the action.
 */
export const SuspendModal = ({ show, user, onClose, onConfirm }) => {
  useEscapeKey(onClose);

  if (!show || !user) return null;

  const isSuspended = user.status === 'suspended';
  const actionLabel = isSuspended ? 'Unsuspend' : 'Suspend';
  const icon        = isSuspended ? faUserCheck : faUserSlash;
  const variant     = isSuspended ? 'success'   : 'danger';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`modal-content modal-content--${variant}`} role="document">

        {/* Close */}
        <button className="modal-close" aria-label="Close modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-icon-wrapper">
            <FontAwesomeIcon icon={icon} />
          </div>
          <h2 className="modal-title" id="suspend-modal-title">
            {actionLabel} User
          </h2>
        </div>

        <hr className="modal-divider" />

        {/* Body */}
        <p className="modal-body">
          Are you sure you want to <strong>{actionLabel.toLowerCase()}</strong> this account?
          {isSuspended
            ? ' They will regain full access to the platform.'
            : ' They will immediately lose access to the platform.'}
        </p>

        {/* User info */}
        <div className="modal-info-card">
          <div className="modal-info-row">
            <span className="modal-info-label">Name</span>
            <span className="modal-info-value">{user.name}</span>
          </div>
          <div className="modal-info-row">
            <span className="modal-info-label">Email</span>
            <span className="modal-info-value">{user.email}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button height="medium" fill="none" outline="dark" textColor="dark" onClick={onClose}>
            Cancel
          </Button>
          <Button height="medium" fill="primary" onClick={onConfirm}>
            {actionLabel}
          </Button>
        </div>

      </div>
    </div>
  );
};

const UserShape = PropTypes.shape({
  id:     PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  name:   PropTypes.string,
  email:  PropTypes.string,
  status: PropTypes.string,
});

SuspendModal.propTypes = {
  show:      PropTypes.bool.isRequired,
  user:      UserShape,
  onClose:   PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};