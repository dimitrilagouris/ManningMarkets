import React, { useState, useEffect } from 'react';
import { fetchAdminData, executeUserAction } from '../../api/adminApi';
import { SystemOverview } from './systemOverview';
import { AdminControls } from './AdminControls';
import { UserManagement } from './userManagement';
import { MarketsOverview } from './marketsOverview';
import { AuditLogs } from './auditLog';
import { SuspendModal } from './ModalSuspend';
import { ModalGivePoints } from './ModalGivePoints';

import '../wallet/wallet.css';
import '../../styles/base.css';
import {useAuthGuard} from "../../hooks/useAuthGuard";

/**
 * Main AdminDashboard Dashboard.
 * @returns {React.JSX.Element}
 */
function AdminDashboard() {
    useAuthGuard();

    const [activeTab, setActiveTab] = useState('Users');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [data, setData] = useState({ users: [], markets: [], auditLogs: [], stats: {} });
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ type: null, user: null });

    const tabInfo = {
        'Users': { title: 'User management', desc: 'Search, filter, and manage user accounts. Suspend bad actors or adjust point balances manually.' },
        'Markets': { title: 'MarketPage overview', desc: 'Review active and closed markets. Monitor participation rates and campus credit volumes across the platform.' },
        'Audit Log': { title: 'System audit log', desc: 'Review a chronological history of administrative actions to ensure compliance and track system modifications.' }
    };

    /** @param {string} tab */
    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setSearchTerm('');
        setFilterStatus('all');
    };

    useEffect(() => {
        fetchAdminData('stats/').then(stats => setData(prev => ({ ...prev, stats }))).catch(console.error);
    }, []);

    useEffect(() => {
        const loadActiveData = async () => {
            try {
                const query = `?search=${searchTerm}&status=${filterStatus}`;
                if (activeTab === 'Users') {
                    const { users } = await fetchAdminData(`users/${query}`);
                    setData(prev => ({ ...prev, users: users || [] }));
                } else if (activeTab === 'MarketPage') {
                    const markets = await fetchAdminData(`markets/${query}`);
                    setData(prev => ({ ...prev, markets: markets || [] }));
                } else if (activeTab === 'Audit Log') {
                    const logs = await fetchAdminData(`audit-logs/${query}`);
                    setData(prev => ({ ...prev, auditLogs: logs.auditLogs || [] }));
                }
            } catch (err) {
                console.error("Failed to load tab data", err);
            } finally {
                setLoading(false);
            }
        };
        loadActiveData();
    }, [activeTab, searchTerm, filterStatus]);

    /**
     * Refreshes the user table data after a successful state change.
     */
    const refreshUserList = async () => {
        const { users } = await fetchAdminData(`users/?search=${searchTerm}&status=${filterStatus}`);
        setData(prev => ({ ...prev, users: users || [] }));
    };

    /**
     * Executes the confirmed modal action and refreshes the user list.
     * @param {number} [payload]
     */
    const handleAction = async (payload = null) => {
        if (!modalState.user) return;

        try {
            const urlSlug = modalState.type === 'points' ? 'give-points' : modalState.type;
            const requestBody = modalState.type === 'points' ? { amount: payload } : null;

            await executeUserAction(modalState.user.id, urlSlug, 'POST', requestBody);
            await refreshUserList();
        } catch (err) {
            alert(err.message);
        } finally {
            setModalState({ type: null, user: null });
        }
    };

    /**
     * Intercepts table actions to handle immediate deletions or route to modals.
     * @param {string} type
     * @param {Object} user
     */
    const handleTableAction = async (type, user) => {
        if (type === 'delete') {
            if (!window.confirm(`Are you sure you want to permanently delete ${user.name}?`)) return;

            try {
                // Ensure your adminApi defaults to 'DELETE' or handles this appropriately.
                // If Django strictly expects a POST, change 'DELETE' to 'POST'.
                await executeUserAction(user.id, 'delete', 'DELETE');
                await refreshUserList();
            } catch (err) {
                alert(`Failed to delete user: ${err.message}`);
            }
            return;
        }

        // Route 'suspend', 'unsuspend', and 'points' to the modal state
        setModalState({ type, user });
    };

    if (loading && !data.stats.totalUsers) return <main className="main-content"><div>Loading Dashboard...</div></main>;

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
                <div className="wallet-container">
                    <section className="wallet-overview-section" aria-labelledby="wallet-overview-heading">
                        <div className="wallet-balance-info" style={{ width: '100%', maxWidth: '100%' }}>
                            <div className="wallet-section-header">System management</div>
                            <h1 id="wallet-overview-heading" className="wallet-section-title">Admin Dashboard</h1>
                            <p className="wallet-description"> Monitor system health, manage user accounts, and review active markets.</p>
                            <SystemOverview stats={data.stats} />
                        </div>
                    </section>

                    <section className="wallet-content-section">
                        <div className="wallet-content-header">
                            <h2 className="wallet-content-title">{tabInfo[activeTab].title}</h2>
                        </div>
                        <p className="wallet-description" style={{ marginBottom: '1.5rem' }}>
                            {tabInfo[activeTab].desc}
                        </p>

                        <AdminControls
                            activeTab={activeTab}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        />

                        <div className="wallet-tabs" role="tablist" style={{ marginBottom: 0 }}>
                            {['Users', 'MarketPage', 'Audit Log'].map(tab => (
                                <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
                                    className={`selection-tab ${activeTab === tab ? 'wallet-tab--active' : ''}`}
                                    onClick={() => handleTabSwitch(tab)}
                                >{tab}</button>
                            ))}
                        </div>

                        {activeTab === 'Users' && <UserManagement users={data.users} onAction={handleTableAction} />}
                        {activeTab === 'MarketPage' && <MarketsOverview markets={data.markets} />}
                        {activeTab === 'Audit Log' && <AuditLogs auditLogs={data.auditLogs} />}
                    </section>
                </div>
            </div>

            <SuspendModal
                show={modalState.type === 'suspend' || modalState.type === 'unsuspend'}
                user={modalState.user}
                onClose={() => setModalState({ type: null, user: null })}
                onConfirm={() => handleAction()}
            />

            <ModalGivePoints
                show={modalState.type === 'points'}
                user={modalState.user}
                onClose={() => setModalState({ type: null, user: null })}
                onConfirm={(amount) => handleAction(amount)}
            />

        </div>
    );
}

export default AdminDashboard;