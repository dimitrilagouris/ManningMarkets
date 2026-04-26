import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { SystemOverview } from './systemOverview';
import { AdminControls } from './AdminControls';
import { UserManagement } from './userManagement';
import { MarketsOverview } from './marketsOverview';
import AuditLogsTable from '../../components/tables/admin/AuditLogTable';
import { SuspendModal } from './ModalSuspend';
import { ModalGivePoints } from './ModalGivePoints';
import Loading from '../../components/common/Loading';

import '../wallet/wallet.css';
import '../../styles/base.css';

function AdminDashboard() {
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

    const handleTabSwitch = (tab) => {
        setActiveTab(tab);
        setSearchTerm('');
        setFilterStatus('all');
    };

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [{ data: stats }, { data: tabRes }] = await Promise.all([
                    client.get('/api/admin/stats/'),
                    client.get('/api/admin/users/?search=&status=all'),
                ]);
                setData(prev => ({ ...prev, stats, users: tabRes.users || [] }));
                setLoading(false);
            } catch (err) {
                console.error("Failed to load dashboard", err);
                // loading stays true, interceptor is redirecting, nothing should render
            }
        };
        loadAll();
    }, []);

    useEffect(() => {
        if (loading) return;

        const query = `?search=${searchTerm}&status=${filterStatus}`;
        const endpoints = {
            'Users': `/api/admin/users/${query}`,
            'MarketPage': `/api/admin/markets/${query}`,
            'Audit Log': `/api/admin/audit-logs/${query}`,
        };
        const keys = {
            'Users': 'users',
            'MarketPage': 'markets',
            'Audit Log': 'auditLogs',
        };

        client.get(endpoints[activeTab])
            .then(({ data: res }) => setData(prev => ({ ...prev, [keys[activeTab]]: res[keys[activeTab]] || [] })))
            .catch(err => console.error("Failed to load tab data", err));
    }, [activeTab, searchTerm, filterStatus]);

    const refreshUserList = async () => {
        const { data: res } = await client.get(`/api/admin/users/?search=${searchTerm}&status=${filterStatus}`);
        setData(prev => ({ ...prev, users: res.users || [] }));
    };

    const handleAction = async (payload = null) => {
        if (!modalState.user) return;
        try {
            const urlSlug = modalState.type === 'points' ? 'give-points' : modalState.type;
            const body = modalState.type === 'points' ? { amount: payload } : null;
            await client.post(`/api/admin/users/${modalState.user.id}/${urlSlug}/`, body);
            await refreshUserList();
        } catch (err) {
            alert(err.message);
        } finally {
            setModalState({ type: null, user: null });
        }
    };

    const handleTableAction = async (type, user) => {
        if (type === 'delete') {
            if (!window.confirm(`Are you sure you want to permanently delete ${user.name}?`)) return;
            try {
                await client.delete(`/api/admin/users/${user.id}/delete/`);
                await refreshUserList();
            } catch (err) {
                alert(`Failed to delete user: ${err.message}`);
            }
            return;
        }
        setModalState({ type, user });
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
                        {activeTab === 'Audit Log' && <AuditLogsTable auditLogs={data.auditLogs} />}
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