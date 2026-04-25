// Wallet.jsx
import React, { useEffect, useState, useMemo } from "react";
import { DJANGO_API_BASE } from "../../config";
import Cookies from 'js-cookie';
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import PropTypes from 'prop-types';

import TransactionsTable from '../../components/tables/wallet/TransactionsTable';
import PositionsTable from '../../components/tables/wallet/PositionsTable';
import LiveOrdersTable from '../../components/tables/wallet/LiveOrdersTable';

import './wallet.css';
import '../../styles/base.css';
import {useAuthGuard} from "../../hooks/useAuthGuard";

/**
 * Executes a standard API request to the Django backend.
 * @param {string} endpoint - The API endpoint to fetch.
 * @param {Object} [options={}] - Fetch options.
 * @returns {Promise<Object>}
 */
const fetchApi = async (endpoint, options = {}) => {
    const res = await fetch(`${DJANGO_API_BASE}${endpoint}`, {
        credentials: 'include',
        headers: { 'X-Requested-With': 'XMLHttpRequest', ...options.headers },
        ...options,
    });

    if (res.status === 401 || res.status === 403) {
        window.location.replace('/login');
        return;
    }

    if (!res.ok) {
        throw new Error(`API request failed for ${endpoint}`);
    }

    return res.json();
};

/**
 * Renders a doughnut chart displaying allocated vs unallocated funds.
 * @param {Object} props
 * @param {number} props.allocated - The amount of allocated points.
 * @param {number} props.unallocated - The amount of unallocated points.
 * @returns {JSX.Element}
 */
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

/**
 * Main container for the user wallet, managing balance, positions, and history.
 * @returns {JSX.Element}
 */
function Wallet() {
    const { redirectToLogin } = useAuthGuard();

    const [activeTab, setActiveTab] = useState('Transactions');
    const [walletData, setWalletData] = useState({ id: "", balance: 0, allocated: 0, available: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [transactions, setTransactions] = useState([]);
    const [positions, setPositions] = useState([]);
    const [liveOrders, setLiveOrders] = useState([]);

    useEffect(() => {
        const loadWallet = async () => {
            try {
                const data = await fetchApi('/wallet/', {}, redirectToLogin);
                setWalletData({
                    id: data.wallet_id,
                    balance: data.balance,
                    allocated: data.allocated,
                    available: data.available
                });
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        loadWallet();
    }, []);

    useEffect(() => {
        const loadTabData = async () => {
            try {
                if (activeTab === 'Transactions') {
                    const data = await fetchApi('/api/wallet/trades/');
                    setTransactions(data.trades || []);
                }
                else if (activeTab === 'Positions') {
                    const data = await fetchApi('/api/wallet/positions/');
                    setPositions(data.positions || []);
                }
                else if (activeTab === 'Live Orders') {
                    const data = await fetchApi('/api/wallet/orders/');
                    setLiveOrders(data.orders || []);
                }
            } catch (err) {
                console.error("Failed to load tab data:", err);
            }
        };

        loadTabData();
    }, [activeTab]);

    const handleCancelOrder = async (orderId) => {
        try {
            await fetchApi('/api/wallet/cancel-order/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': Cookies.get('csrftoken'),
                },
                body: JSON.stringify({ order_id: orderId }),
            });

            const data = await fetchApi('/api/wallet/orders/');
            setLiveOrders(data.orders || []);
        } catch (err) {
            console.error("Failed to cancel order:", err);
        }
    };

    if (loading) return <main className="main-content"><div>Loading Wallet...</div></main>;
    if (error) return <main className="main-content"><div>Error: {error.message}</div></main>;

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
                <div className="wallet-container">
                    <section className="wallet-overview-section" aria-labelledby="wallet-overview-heading">
                        <div className="wallet-balance-info" aria-labelledby="wallet-overview-heading">
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
                                {activeTab === 'Transactions' ? 'Transaction history' :
                                 activeTab === 'Positions' ? 'Current positions' : 'Live orders'}
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
                            {['Transactions', 'Positions', 'Live Orders'].map(tab => (
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

                        {activeTab === 'Transactions' && <TransactionsTable transactions={transactions} />}
                        {activeTab === 'Positions' && <PositionsTable positions={positions} />}
                        {activeTab === 'Live Orders' && <LiveOrdersTable liveOrders={liveOrders} onCancelOrder={handleCancelOrder} />}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default Wallet;