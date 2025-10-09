// Admin.jsx
import React, { useState } from 'react';
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

function Admin() {
  // Mock data - replace w API later
  const [users, setUsers] = useState([
    { id: 1, name: 'Alex Vaughan', email: 'alex.vaughan@123.com', status: 'active', joinDate: '2024-01-15' },
    { id: 2, name: 'Will Defina', email: 'will.defina@123.com', status: 'active', joinDate: '2024-02-20' },
    { id: 3, name: 'Tommy Roche', email: 'tommy.roche@123.com', status: 'suspended', joinDate: '2024-01-10' },
    { id: 4, name: 'Dimitri Lagouris', email: 'dimitri.lagouris@123.com', status: 'active', joinDate: '2024-03-05' },
  ]);

  const [markets, setMarkets] = useState([
    { id: 1, title: 'market1', status: 'active', participants: 45, price: 10, volume: 15000 },
    { id: 2, title: 'market2', status: 'active', participants: 102, price: 8, volume: 32500 },
    { id: 3, title: 'market3', status: 'closed', participants: 28, price: 12 , volume: 8900},
  ]);

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, admin: 'Admin User', action: 'Suspended user account', target: 'Alex Vaughan', timestamp: '2024-10-07 14:30:22' },
    { id: 2, admin: 'Admin User', action: 'Created new market', target: 'market1', timestamp: '2024-10-07 12:15:10' },
    { id: 3, admin: 'Admin User', action: 'Deleted user account', target: 'Will Defina', timestamp: '2024-10-06 16:45:33' },
    { id: 4, admin: 'Admin User', action: 'Updated market status', target: 'market2', timestamp: '2024-10-06 11:20:15' },
  ]);

  // Modal states
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showUnsuspendModal, setShowUnsuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const totalMarkets = markets.length;
  const activeMarkets = markets.filter(m => m.status === 'active').length;
}