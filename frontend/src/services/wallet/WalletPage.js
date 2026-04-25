import React, { useEffect, useState, useMemo } from "react";
import client from '../../api/client';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import PropTypes from 'prop-types';

import TransactionsTable from '../../components/tables/wallet/TransactionsTable';
import PositionsTable from '../../components/tables/wallet/PositionsTable';
import LiveOrdersTable from '../../components/tables/wallet/LiveOrdersTable';

import './wallet.css';
import '../../styles/base.css';
import Loading from "../../components/Loading";

const PieChart = ({ allocated, unallocated }) => {
    const total = allocated + unallocated;
    const allocatedPct = total === 0 ? 0 : Math.round((allocated / total) * 100);

    const data = useMemo(() => ({
        labels: ['Allocated', 'Unallocated'],
        datasets: [{
            data: [allocated, unallocated],
            borderWidth: 0,
            backgroundColor: ['var(--usyd-red)', '#e0e0e0'],
            hoverBackgroundColor: ['var(--usyd-red-dark)', '#d0d0d0'],
            cutout: '66%'
        }]
    }), [allocated, unallocated]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()}` } }
        }
    }), []);

    return (
        <div className="wallet-pie" role="img" aria-label={`${allocatedPct}% allocated`}>
            <Doughnut data={data} options={options} />
            <div className="wallet-pie__label" aria-hidden="true">
                <div className="wallet-pie__value">{allocatedPct}%</div>
                <div className="wallet-pie__sub">allocated</div>
            </div>
        </div>
    );
};

PieChart.propTypes = {
    allocated: PropTypes.number.isRequired,
    unallocated: PropTypes.number.isRequired,
};

const TAB_ENDPOINTS = {
    Transactions: '/api/wallet/trades/',
    Positions:    '/api/wallet/positions/',
    'Live Orders': '/api/wallet/orders/',
};

const TAB_KEYS = {
    Transactions: 'trades',
    Positions:    'positions',
    'Live Orders': 'orders',
};

function Wallet() {
    const [activeTab, setActiveTab] = useState('Transactions');
    const [walletData, setWalletData] = useState({ id: "", balance: 0, allocated: 0, available: 0 });
    const [tabData, setTabData] = useState({ Transactions: [], Positions: [], 'Live Orders': [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        client.get('/wallet/')
            .then(({ data }) => setWalletData({
                id: data.wallet_id,
                balance: data.balance,
                allocated: data.allocated,
                available: data.available,
            }))
            .catch(err => setError(err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const endpoint = TAB_ENDPOINTS[activeTab];
        const key = TAB_KEYS[activeTab];

        client.get(endpoint)
            .then(({ data }) => setTabData(prev => ({ ...prev, [activeTab]: data[key] || [] })))
            .catch(err => console.error(`Failed to load ${activeTab}:`, err));
    }, [activeTab]);

    const handleCancelOrder = async (orderId) => {
        try {
            await client.post('/api/wallet/cancel-order/', { order_id: orderId });
            const { data } = await client.get(TAB_ENDPOINTS['Live Orders']);
            setTabData(prev => ({ ...prev, 'Live Orders': data.orders || [] }));
        } catch (err) {
            console.error("Failed to cancel order:", err);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
                <div className="wallet-container">
                    <section className="wallet-overview-section" aria-labelledby="wallet-overview-heading">
                        <div className="wallet-balance-info">
                            <div className="wallet-section-header">Wallet overview</div>
                            <h1 id="wallet-overview-heading" className="wallet-section-title">My Wallet</h1>
                            <p className="wallet-description">
                                View your current points balance and allocation. Your points are distributed
                                between active market positions and available funds for new investments.
                            </p>

                            <div className="wallet-balance-list">
                                <div className="wallet-balance-item">
                                    <div className="wallet-balance-label">Total balance</div>
                                    <div className="wallet-balance-value">{(walletData.balance || 0).toFixed(2)} pts</div>
                                </div>
                                <div className="wallet-balance-item">
                                    <div className="wallet-balance-label">Currently allocated</div>
                                    <div className="wallet-balance-value">{(walletData.allocated || 0).toFixed(2)} pts</div>
                                </div>
                                <div className="wallet-balance-item">
                                    <div className="wallet-balance-label">Available for trading</div>
                                    <div className="wallet-balance-value">{(walletData.available || 0).toFixed(2)} pts</div>
                                </div>
                            </div>
                        </div>

                        <div className="wallet-chart-container" aria-hidden="true">
                            <PieChart allocated={walletData.allocated || 0} unallocated={walletData.available || 0} />
                        </div>
                    </section>

                    <section className="wallet-content-section" aria-labelledby="wallet-content-heading">
                        <div className="wallet-content-header">
                            <h2 id="wallet-content-heading" className="wallet-content-title">
                                {{ Transactions: 'Transaction history', Positions: 'Current positions', 'Live Orders': 'Live orders' }[activeTab]}
                            </h2>
                        </div>
                        <p className="wallet-description">
                            This section shows your transaction history, current positions and wallet balance. There is detailed
                            information for each of your market activities, which gives you insights into your trading performance
                            including profit/loss details and a record of all market interactions.
                            <br /><br />
                            Your balance and positions are updated in real-time as markets resolve. You can review your transaction
                            history to track your prediction accuracy and trading patterns over time.
                        </p>

                        <div className="wallet-tabs" role="tablist" aria-label="Wallet tabs">
                            {Object.keys(TAB_ENDPOINTS).map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    aria-selected={activeTab === tab}
                                    className={`selection-tab ${activeTab === tab ? 'wallet-tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'Transactions' && <TransactionsTable transactions={tabData.Transactions} />}
                        {activeTab === 'Positions' && <PositionsTable positions={tabData.Positions} />}
                        {activeTab === 'Live Orders'  && <LiveOrdersTable liveOrders={tabData['Live Orders']} onCancelOrder={handleCancelOrder} />}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Wallet;