// Admin.jsx
import React, { useState, useEffect } from 'react';
import './admin.css';
import '../base.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt,
  faUserSlash,
  faTrash,
  faTimes,
  faExclamationTriangle,
  faHistory,
  faSearch,
  faFilter,
  faUserCheck
} from '@fortawesome/free-solid-svg-icons';
import { DJANGO_API_BASE } from '../config';
import { getCSRFToken } from '../session_management/csrfToken';

function Admin() {
  //States
  const [users, setUsers] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalMarkets: 0,
    activeMarkets: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchStats(),
        fetchMarkets(),
        fetchAuditLogs()
      ]);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${DJANGO_API_BASE}/api/admin/users/?search=${searchTerm}&status=${filterStatus}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${DJANGO_API_BASE}/api/admin/stats/`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  onst fetchMarkets = async () => {
    try {
      const res = await fetch(`${DJANGO_API_BASE}/api/admin/markets/`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMarkets(data.markets);
      }
    } catch (err) {
      console.error('Error fetching markets:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${DJANGO_API_BASE}/api/admin/audit-logs/`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setAuditLogs(data.auditLogs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  
  // Handlers
  const handleSuspendClick = (user) => {
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const handleUnsuspendClick = (user) => {
    setSelectedUser(user);
    setShowUnsuspendModal(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmSuspend = () => {
    if (selectedUser) {
      // Update user status
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, status: 'suspended' } : u
      ));
      
      // Add audit log
      const newLog = {
        id: auditLogs.length + 1,
        admin: 'Admin User',
        action: 'Suspended user account',
        target: selectedUser.name,
        timestamp: new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
    setShowSuspendModal(false);
    setSelectedUser(null);
  };

  const handleConfirmUnsuspend = () => {
    if (selectedUser) {
      // Update user status to active
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, status: 'active' } : u
      ));
      
      // Add audit log
      const newLog = {
        id: auditLogs.length + 1,
        admin: 'Admin User',
        action: 'Unsuspended user account',
        target: selectedUser.name,
        timestamp: new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
    setShowUnsuspendModal(false);
    setSelectedUser(null);
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      // Remove user
      setUsers(users.filter(u => u.id !== selectedUser.id));
      
      // Add audit log
      const newLog = {
        id: auditLogs.length + 1,
        admin: 'Admin User',
        action: 'Deleted user account',
        target: selectedUser.name,
        timestamp: new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
          hour12: false 
        })
      };
      setAuditLogs([newLog, ...auditLogs]);
    }
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <div className="admin-page">
        <main className="admin-content">
          <div className="admin-container">
            {/* Header */}
            <div className="admin-container__header">
              <h1 className="admin-container__title">Admin Dashboard</h1>
              <p className="admin-container__subtitle">System Management & Monitoring</p>
            </div>

            {/* Stats Overview */}
            <section className="admin-container__section">
              <h2 className="admin-section__title">System Overview</h2>
              <div className="admin-stats">
                <div className="stat-card">
                  <div className="stat-content">
                    <p className="stat-value">{totalUsers}</p>
                    <p className="stat-label">Total Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-content">
                    <p className="stat-value">{activeUsers}</p>
                    <p className="stat-label">Active Users</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-content">
                    <p className="stat-value">{suspendedUsers}</p>
                    <p className="stat-label">Suspended</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-content">
                    <p className="stat-value">{activeMarkets}/{totalMarkets}</p>
                    <p className="stat-label">Active Markets</p>
                  </div>
                </div>
              </div>
            </section>

            {/* User Management */}
            <section className="admin-container__section">
              <h2 className="admin-section__title">User Management</h2>
              
              {/* Search and Filter */}
              <div className="admin-controls">
                <div className="search-box">
                  <FontAwesomeIcon icon={faSearch} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="filter-box">
                  <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td className="user-name">{user.name}</td>
                        <td className="user-email">{user.email}</td>
                        <td>
                          <span className={`status-badge status-badge--${user.status}`}>
                            {user.status}
                          </span>
                        </td>
                        <td>{user.joinDate}</td>
                        <td className="actions-cell">
                          {user.status === 'active' && (
                            <button 
                              className="action-btn action-btn--suspend"
                              onClick={() => handleSuspendClick(user)}
                              aria-label="Suspend user"
                            >
                              Suspend
                            </button>
                          )}
                          {user.status === 'suspended' && (
                            <button 
                              className="action-btn action-btn--unsuspend"
                              onClick={() => handleUnsuspendClick(user)}
                              aria-label="Unsuspend user"
                            >
                              Unsuspend
                            </button>
                          )}
                          <button 
                            className="action-btn action-btn--delete"
                            onClick={() => handleDeleteClick(user)}
                            aria-label="Delete user"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Markets Overview */}
            <section className="admin-container__section">
              <h2 className="admin-section__title">Markets Overview</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Market Title</th>
                      <th>Status</th>
                      <th>Participants</th>
                      <th>Price (Campus Credits)</th>
                      <th>Volume (Campus Credits)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markets.map(market => (
                      <tr key={market.id}>
                        <td>{market.id}</td>
                        <td className="market-title">{market.title}</td>
                        <td>
                          <span className={`status-badge status-badge--${market.status}`}>
                            {market.status}
                          </span>
                        </td>
                        <td>{market.participants}</td>
                        <td>{market.price.toLocaleString()}</td>
                        <td>{market.volume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Audit Log */}
            <section className="admin-container__section">
              <h2 className="admin-section__title">
                <FontAwesomeIcon icon={faHistory} /> Audit Log
              </h2>
              <div className="audit-log">
                {auditLogs.map(log => (
                  <div key={log.id} className="audit-log-item">
                    <div className="audit-log-icon">
                      <FontAwesomeIcon icon={faShieldAlt} />
                    </div>
                    <div className="audit-log-content">
                      <p className="audit-log-action">
                        <strong>{log.admin}</strong> {log.action}: <em>{log.target}</em>
                      </p>
                      <p className="audit-log-timestamp">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowSuspendModal(false)}>
          <div className="modal-content modal-content--warning" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FontAwesomeIcon icon={faUserSlash} /> Suspend User Account
              </h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowSuspendModal(false)}
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-warning">
                <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
                <p>Are you sure you want to suspend this user account?</p>
              </div>
              <div className="modal-user-info">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>User ID:</strong> {selectedUser.id}</p>
              </div>
              <p className="modal-note">
                This action will prevent the user from accessing their account. 
                This action will be logged in the audit trail.
              </p>
              <div className="modal-actions">
                <button 
                  className="modal-btn modal-btn--cancel"
                  onClick={() => setShowSuspendModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn modal-btn--confirm-suspend"
                  onClick={handleConfirmSuspend}
                >
                  Confirm Suspension
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsuspend Modal */}
      {showUnsuspendModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUnsuspendModal(false)}>
          <div className="modal-content modal-content--success" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FontAwesomeIcon icon={faUserCheck} /> Unsuspend User Account
              </h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowUnsuspendModal(false)}
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-warning modal-warning--success">
                <FontAwesomeIcon icon={faUserCheck} className="success-icon" />
                <p>Are you sure you want to reactivate this user account?</p>
              </div>
              <div className="modal-user-info">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>User ID:</strong> {selectedUser.id}</p>
              </div>
              <p className="modal-note">
                This action will restore the user's access to their account. 
                This action will be logged in the audit trail.
              </p>
              <div className="modal-actions">
                <button 
                  className="modal-btn modal-btn--cancel"
                  onClick={() => setShowUnsuspendModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn modal-btn--confirm-unsuspend"
                  onClick={handleConfirmUnsuspend}
                >
                  Confirm Reactivation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-content--danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <FontAwesomeIcon icon={faTrash} /> Delete User Account
              </h2>
              <button 
                className="modal-close-btn"
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close modal"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-warning modal-warning--danger">
                <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
                <p>Are you sure you want to permanently delete this user account?</p>
              </div>
              <div className="modal-user-info">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>User ID:</strong> {selectedUser.id}</p>
              </div>
              <p className="modal-note modal-note--danger">
                <strong>Warning:</strong> This action cannot be undone. All user data will be permanently deleted.
                This action will be logged in the audit trail.
              </p>
              <div className="modal-actions">
                <button 
                  className="modal-btn modal-btn--cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="modal-btn modal-btn--confirm-delete"
                  onClick={handleConfirmDelete}
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Admin;


