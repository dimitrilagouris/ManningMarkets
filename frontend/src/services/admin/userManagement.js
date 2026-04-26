// userManagement.jsx
import React from 'react';
import PropTypes from 'prop-types';
import UsersTable from '../../components/tables/admin/UsersTable';

/**
 * @typedef {Object} User
 * @property {string|number} id
 * @property {string} name
 * @property {string} email
 * @property {string} status
 * @property {string} joinDate
 */

/**
 * Renders the user management page layout.
 * @param {Object} props
 * @param {User[]} props.users - List of users to display.
 * @param {function(string, User): void} props.onAction - Callback for user actions.
 * @returns {React.JSX.Element}
 */
export const UserManagement = ({ users, onAction }) => (
    <div className="user-management-page">
        {/* You can add your page header, search bars, or filters here */}
        <UsersTable users={users} onAction={onAction} />
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

export default UserManagement;