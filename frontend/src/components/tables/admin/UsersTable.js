// UsersTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../../common/Badge';
import { Button } from '../../buttons/Button';
import '../table.css';

/**
 * Maps a user account status to its corresponding badge colour.
 * @param {string} status - The current account status.
 * @returns {string} The badge colour identifier.
 */
const getStatusColour = (status) => {
    const currentStatus = status.toLowerCase();
    if (currentStatus === 'active') return 'green';
    if (currentStatus === 'suspended') return 'yellow';
    return 'grey';
};

const UserRow = ({ user, isAlt, onAction }) => {
    const rowClass = `table-row ${isAlt ? 'table-row--alt' : ''}`;

    return (
        <div className={rowClass} role="row">
            <div className="table-col" role="cell">{user.id}</div>
            <div className="table-col user-name" role="cell">{user.name}</div>
            <div className="table-col user-email" role="cell" style={{ wordBreak: 'break-all' }}>{user.email}</div>

            <div className="table-col" role="cell">
                <Badge label={user.status} colour={getStatusColour(user.status)} />
            </div>

            <div className="table-col" role="cell">{user.joinDate}</div>

            {/* Removed inline style, added table-col--actions here */}
            <div className="table-col table-col--actions" role="cell">
                {user.status === 'active' && (
                    <Button height="x-short" fill="none" outline="dark" textColor="dark" onClick={() => onAction('suspend', user)}>
                        Suspend
                    </Button>
                )}
                {user.status === 'suspended' && (
                    <Button height="x-short" fill="none" outline="dark" textColor="dark" onClick={() => onAction('unsuspend', user)}>
                        Unsuspend
                    </Button>
                )}
                {user.status === 'active' && (
                    <Button height="x-short" fill="none" outline="primary" textColor="primary" onClick={() => onAction('points', user)}>
                        Points
                    </Button>
                )}
                <Button height="x-short" fill="primary" onClick={() => onAction('delete', user)}>
                    Delete
                </Button>
            </div>
        </div>
    );
};

/**
 * Displays a structured table of users for administrative management.
 * @param {Object} props
 * @param {Array} props.users - List of users to display.
 * @param {function(string, Object): void} props.onAction - Callback for user actions.
 * @returns {React.JSX.Element}
 */
const UsersTable = ({ users, onAction }) => (
    <div className="table-container users-table" role="table" aria-label="User management list">
        <div className="table-header" role="row">
            <div className="table-col">ID</div>
            <div className="table-col">Name</div>
            <div className="table-col">Email</div>
            <div className="table-col">Status</div>
            <div className="table-col">Join Date</div>
            <div className="table-col">Actions</div>
        </div>

        <div className="table-body" role="rowgroup">
            {users.map((user, idx) => (
                <UserRow
                    key={user.id}
                    user={user}
                    isAlt={idx % 2 === 1}
                    onAction={onAction}
                />
            ))}
        </div>
    </div>
);

const UserShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    joinDate: PropTypes.string.isRequired,
});

UserRow.propTypes = {
    user: UserShape.isRequired,
    isAlt: PropTypes.bool.isRequired,
    onAction: PropTypes.func.isRequired,
};

UsersTable.propTypes = {
    users: PropTypes.arrayOf(UserShape).isRequired,
    onAction: PropTypes.func.isRequired,
};

export default UsersTable;