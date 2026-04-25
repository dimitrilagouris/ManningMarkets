import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '../../components/buttons/Button';

/**
 * @typedef {Object} User
 * @property {string|number} id
 * @property {string} name
 * @property {string} email
 * @property {string} status
 * @property {string} joinDate
 */

/**
 * Renders the user management list using the standard table UI structure.
 * @param {Object} props
 * @param {User[]} props.users
 * @param {function(string, User): void} props.onAction
 * @returns {React.JSX.Element}
 */
export const UserManagement = ({ users, onAction }) => (
  <div className="wallet-transactions-table users-table" role="table" aria-label="User management list">
    <div className="wallet-transactions-header" role="row">
      <div className="wallet-table-col">ID</div>
      <div className="wallet-table-col">Name</div>
      <div className="wallet-table-col">Email</div>
      <div className="wallet-table-col">Status</div>
      <div className="wallet-table-col">Join Date</div>
      <div className="wallet-table-col">Actions</div>
    </div>

    <div className="wallet-transactions-body" role="rowgroup">
      {users.map((user, idx) => (
        <div
          key={user.id}
          className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`}
          role="row"
        >
          <div className="wallet-table-col" role="cell">{user.id}</div>
          <div className="wallet-table-col user-name" role="cell">{user.name}</div>
          <div className="wallet-table-col user-email" role="cell" style={{ wordBreak: 'break-all' }}>{user.email}</div>

          <div className="wallet-table-col" role="cell">
            <span className={`status-badge status-badge--${user.status}`}>
              {user.status}
            </span>
          </div>

          <div className="wallet-table-col" role="cell">{user.joinDate}</div>

          <div className="wallet-table-col actions-cell" role="cell" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {user.status === 'active' && (
              <Button
                height="x-short"
                fill="none"
                outline="dark"
                textColor="dark"
                onClick={() => onAction('suspend', user)}
              >
                Suspend
              </Button>
            )}
            {user.status === 'suspended' && (
              <Button
                height="x-short"
                fill="none"
                outline="dark"
                textColor="dark"
                onClick={() => onAction('unsuspend', user)}
              >
                Unsuspend
              </Button>
            )}
            {user.status === 'active' && (
              <Button
                height="x-short"
                fill="none"
                outline="primary"
                textColor="primary"
                onClick={() => onAction('points', user)}
              >
                Points
              </Button>
            )}
            <Button
              height="x-short"
              fill="primary"
              onClick={() => onAction('delete', user)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

UserManagement.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      joinDate: PropTypes.string.isRequired,
    })
  ).isRequired,
  onAction: PropTypes.func.isRequired,
};