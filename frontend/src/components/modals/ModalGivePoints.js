import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../buttons/Button';
import { FormInput } from '../forms/FormInput';
import { useEscapeKey } from './ModalSuspend';
import './modals.css';

/**
 * Modal to assign a specified number of points to a user.
 *
 * @param {Object}           props
 * @param {boolean}          props.show
 * @param {Object}           [props.user]   - { id, name, email }
 * @param {Function}         props.onClose
 * @param {function(number)} props.onConfirm
 */
export const ModalGivePoints = ({ show, user, onClose, onConfirm }) => {
  const [points, setPoints] = useState('');

  useEscapeKey(onClose);

  useEffect(() => {
    if (show) setPoints('');
  }, [show]);

  if (!show || !user) return null;

  const amount  = parseInt(points, 10);
  const isValid = !isNaN(amount) && amount > 0;

  const handleSubmit = () => {
    if (isValid) onConfirm(amount);
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="give-points-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-content modal-content--warning" role="document">

        {/* Close */}
        <button className="modal-close" aria-label="Close modal" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-icon-wrapper">
            <FontAwesomeIcon icon={faCoins} />
          </div>
          <h2 className="modal-title" id="give-points-modal-title">
            Give Points
          </h2>
        </div>

        <hr className="modal-divider" />

        {/* Body */}
        <p className="modal-body">
          Assign additional points to this account.
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

        {/* Input */}
        <div className="modal-field">
          <FormInput
            type="number"
            label="Amount"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="e.g. 100"
            min={1}
            fullWidth
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <Button height="medium" fill="none" outline="dark" textColor="dark" onClick={onClose}>
            Cancel
          </Button>
          <Button height="medium" fill="primary" onClick={handleSubmit} disabled={!isValid}>
            Confirm
          </Button>
        </div>

      </div>
    </div>
  );
};

ModalGivePoints.propTypes = {
  show:      PropTypes.bool.isRequired,
  user:      PropTypes.shape({
    id:    PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name:  PropTypes.string,
    email: PropTypes.string,
  }),
  onClose:   PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};