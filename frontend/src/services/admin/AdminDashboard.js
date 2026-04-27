import React, { useState, useEffect } from 'react';
import { fetchAdminData, executeUserAction } from '../../api/adminApi';
import { SystemOverview } from './systemOverview';
import { AdminControls } from './AdminControls';
import { UserManagement } from './userManagement';
import { MarketsOverview } from './marketsOverview';
import AuditLogsTable from '../../components/tables/admin/AuditLogTable';
import { SuspendModal } from '../../components/modals/ModalSuspend';
import { ModalGivePoints } from '../../components/modals/ModalGivePoints';
import { ModalDeleteUser } from "../../components/modals/ModalDeleteUser";
import Loading from '../../components/common/Loading';

import '../wallet/wallet.css';
import '../../styles/base.css';

/**
 * @typedef {Object} ModalState
 * @property {string|null} type - The action type (e.g., 'suspend', 'delete').
 * @property {Object|null} user - The target user object.
 */

/**
 * @typedef {Object} DashboardData
 * @property {Array} users
 * @property {Array} markets
 * @property {Array} auditLogs
 * @property {Object} stats
 */

/** @type {Record<string, {title: string, desc: string}>} */
const TAB_INFO = {
    'Users': { title: 'User management', desc: 'Search, filter, and manage user accounts. Suspend bad actors or adjust point balances manually.' },
    'MarketPage': { title: 'MarketPage overview', desc: 'Review active and closed markets. Monitor participation rates and campus credit volumes across the platform.' },
    'Audit Log': { title: 'System audit log', desc: 'Review a chronological history of administrative actions to ensure compliance and track system modifications.' }
};

/**
 * Maps the active tab to the corresponding API endpoint structure.
 * @param {string} tab - Current active tab.
 * @param {string} query - Formatted URL query parameters.
 * @returns {string} - The endpoint suffix for fetchAdminData.
 */
const getEndpointForTab = (tab, query) => {
    const mapping = {
        'Users': `users/${query}`,
        'MarketPage': `markets/${query}`,
        'Audit Log': `audit-logs/${query}`,
    };
    return mapping[tab];
};

/**
 * Executes an administrative user action via the admin API.
 * @param {ModalState} modalState - The action type and target user.
 * @param {number} [payload] - Optional data, such as point amounts.
 * @returns {Promise<void>}
 */
const processAdminAction = async (modalState, payload = undefined) => {
    const { type, user } = modalState;
    if (!user || !type) return;

    const method = type === 'delete' ? 'DELETE' : 'POST';
    const actionSlug = type === 'points' ? 'give-points' : type;
    const body = type === 'points' ? { amount: payload } : null;

    await executeUserAction(user.id, actionSlug, method, body);
};

export default function AdminDashboard() {
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [activeTab, setActiveTab] = useState('Users');
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [searchTerm, setSearchTerm] = useState('');
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [filterStatus, setFilterStatus] = useState('all');

    /** @type {[DashboardData, React.Dispatch<React.SetStateAction<DashboardData>>]} */
    const [data, setData] = useState({ users: [], markets: [], auditLogs: [], stats: {} });
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(true);
    /** @type {[ModalState, React.Dispatch<React.SetStateAction<ModalState>>]} */
    const [modalState, setModalState] = useState({ type: null, user: null });

    useEffect(() => {
        /**
         * Fetches initial dashboard statistics and default user list.
         * @returns {Promise<void>}
         */
        const initialiseDashboard = async () => {
            try {
                const [stats, tabRes] = await Promise.all([
                    fetchAdminData('stats/'),
                    fetchAdminData('users/?search=&status=all'),
                ]);
                setData(prev => ({ ...prev, stats, users: tabRes.users || [] }));
                setLoading(false);
            } catch (err) {
                console.error("Dashboard initialisation failed", err);
                if (err.message.includes('401') || err.message.includes('403')) {
                    window.location.replace('/login');
                }
            }
        };
        initialiseDashboard();
    }, []);

    useEffect(() => {
        if (loading) return;

        /**
         * Fetches specific data when the active tab or filters change.
         * @returns {Promise<void>}
         */
        const loadTabData = async () => {
            const query = `?search=${searchTerm}&status=${filterStatus}`;
            const endpoint = getEndpointForTab(activeTab, query);
            const stateKey = activeTab === 'Audit Log' ? 'auditLogs' : activeTab.toLowerCase();

            try {
                const res = await fetchAdminData(endpoint);
                setData(prev => ({ ...prev, [stateKey]: res[stateKey] || [] }));
            } catch (err) {
                console.error("Failed to load tab data", err);
            }
        };
        loadTabData();
    }, [activeTab, searchTerm, filterStatus, loading]);

    /**
     * Resets filters and updates the current active tab.
     * @param {string} tab - The new tab to select.
     */
    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setSearchTerm('');
        setFilterStatus('all');
    };

    /**
     * Routes the modal action to the API and triggers a state refresh.
     * @param {number} [payload] - Optional data payload for the request.
     */
    const handleActionConfirm = async (payload) => {
        try {
            await processAdminAction(modalState, payload);
            const res = await fetchAdminData(`users/?search=${searchTerm}&status=${filterStatus}`);
            setData(prev => ({ ...prev, users: res.users || [] }));
        } catch (err) {
            alert(err.message);
        } finally {
            setModalState({ type: null, user: null });
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
                <div className="wallet-container">
                    <section className="wallet-overview-section" aria-labelledby="wallet-overview-heading">
                        <div className="wallet-balance-info" style={{ width: '100%', maxWidth: '100%' }}>
                            <div className="wallet-section-header">System management</div>
                            <h1 id="wallet-overview-heading" className="wallet-section-title">Admin Dashboard</h1>
                            <p className="wallet-description">Monitor system health, manage user accounts, and review active markets.</p>
                            <SystemOverview stats={data.stats} />
                        </div>
                    </section>

                    <section className="wallet-content-section">
                        <div className="wallet-content-header">
                            <h2 className="wallet-content-title">{TAB_INFO[activeTab].title}</h2>
                        </div>
                        <p className="wallet-description" style={{ marginBottom: '1.5rem' }}>
                            {TAB_INFO[activeTab].desc}
                        </p>

                        <AdminControls
                            activeTab={activeTab}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        />

                        <div className="wallet-tabs" role="tablist" style={{ marginBottom: 0 }}>
                            {Object.keys(TAB_INFO).map(tab => (
                                <button key={tab} type="button" role="tab" aria-selected={activeTab === tab}
                                    className={`selection-tab ${activeTab === tab ? 'wallet-tab--active' : ''}`}
                                    onClick={() => handleTabSwitch(tab)}
                                >{tab}</button>
                            ))}
                        </div>

                        {activeTab === 'Users' && <UserManagement users={data.users} onAction={(type, user) => setModalState({ type, user })} />}
                        {activeTab === 'MarketPage' && <MarketsOverview markets={data.markets} />}
                        {activeTab === 'Audit Log' && <AuditLogsTable auditLogs={data.auditLogs} />}
                    </section>
                </div>
            </div>

            <SuspendModal
                show={['suspend', 'unsuspend'].includes(modalState.type)}
                user={modalState.user}
                onClose={() => setModalState({ type: null, user: null })}
                onConfirm={() => handleActionConfirm()}
            />

            <ModalGivePoints
                show={modalState.type === 'points'}
                user={modalState.user}
                onClose={() => setModalState({ type: null, user: null })}
                onConfirm={handleActionConfirm}
            />

            <ModalDeleteUser
                show={modalState.type === 'delete'}
                user={modalState.user}
                onClose={() => setModalState({ type: null, user: null })}
                onConfirm={() => handleActionConfirm()}
            />
        </div>
    );
}