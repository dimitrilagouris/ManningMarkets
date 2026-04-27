import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../buttons/Button';
import { FormInput } from '../forms/FormInput';
import { useEscapeKey } from './ModalSuspend';
import './modals.css';

const CONFIRM_WORD = 'delete';

/**
 * Modal to permanently delete a user. Requires the user to type "delete" to confirm.
 *
 * @param {Object} props
 * @param {boolean} props.show
 * @param {Object} [props.user] { id, name, email }
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm
 */
export const ModalDeleteUser = ({ show, user, onClose, onConfirm }) => {
  const [confirmation, setConfirmation] = useState('');

  useEscapeKey(onClose);

  useEffect(() => {
    if (show) setConfirmation('');
  }, [show]);

  if (!show || !user) return null;

  const isValid = confirmation.trim().toLowerCase() === CONFIRM_WORD;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-user-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content modal-content--danger" role="document">

        {/* Close */}
        <button className="modal-close" aria-label="Close modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-icon-wrapper">
            <FontAwesomeIcon icon={faTrash} />
          </div>
          <h2 className="modal-title" id="delete-user-modal-title">
            Delete User
          </h2>
        </div>

        <hr className="modal-divider" />

        {/* Body */}
        <p className="modal-body">
          This action is <strong>permanent and cannot be undone.</strong> All data associated
          with this account will be irreversibly removed from the platform.
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

        {/* Confirmation input */}
        <div className="modal-field">
          <FormInput
            type="text"
            label={`Type "${CONFIRM_WORD}" to confirm`}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValid && onConfirm()}
            placeholder={CONFIRM_WORD}
            fullWidth
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button height="medium" fill="none" outline="dark" textColor="dark" onClick={onClose}>
            Cancel
          </Button>
          <Button height="medium" fill="primary" onClick={onConfirm} disabled={!isValid}>
            Delete User
          </Button>
        </div>

      </div>
    </div>
  );
};

ModalDeleteUser.propTypes = {
  show: PropTypes.bool.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};