// Wallet.jsx
import React, {useEffect, useState, useMemo} from "react";
import { DJANGO_API_BASE } from "../config";
import Cookies from 'js-cookie';

import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';
import PropTypes from 'prop-types';
import './wallet.css';
import '../base.css';

const fmt = num => (typeof num === 'number' ? num.toLocaleString() : num);

const PieChart = ({ allocated, unallocated }) => {
  const total = allocated + unallocated;
  const allocatedPct = total === 0 ? 0 : Math.round((allocated / total) * 100);

  const data = useMemo(() => ({
    labels: ['Allocated', 'Unallocated'],
    datasets: [
      {
        data: [allocated, unallocated],
        borderWidth: 0,
        backgroundColor: [
          'var(--usyd-red)',
          '#e0e0e0'
        ],
        hoverBackgroundColor: [
          'var(--usyd-red-dark)',
          '#d0d0d0'
        ],
        cutout: '66%'
      }
    ]
  }), [allocated, unallocated]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()}`
        }
      }
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

function Wallet() {
    const [activeTab, setActiveTab] = useState('Transactions');
    const [wallet_id, setWallet_Id] = useState("");
    const [balance, setBalance] = useState(0);
    const [allocated, setAllocated] = useState(0);
    const [available, setAvailable] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [positions, setPositions] = useState([]);
    const [liveOrders, setLiveOrders] = useState([]);


    useEffect(() => {
        const fetch_wallet = async () => {
            try {
                const res = await fetch(`${DJANGO_API_BASE}/wallet/`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {'X-Requested-With': 'XMLHttpRequest'},
                });

                if (!res.ok){
                    throw new Error("Failed to fetch wallet");
                }

                const data = await res.json()

                setWallet_Id(data.wallet_id);
                setBalance(data.balance);
                setAllocated(data.allocated);
                setAvailable(data.available);
            }

            catch (err){
                console.error("Fetching Wallet Error: ", err);
                setError(err);
            }

            finally{
                setLoading(false);
            }
        };

        fetch_wallet();
    }, []);

    // Fetch additional data when tab changes
    useEffect(() => {
        const fetchTabData = async () => {
            if (activeTab === 'Transactions') {
                try {
                    const res = await fetch(`${DJANGO_API_BASE}/api/wallet/trades/`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {'X-Requested-With': 'XMLHttpRequest'},
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setTransactions(data.trades || []);
                    }
                } catch (err) {
                    console.error("Error fetching trades:", err);
                }
            } else if (activeTab === 'Positions') {
                try {
                    const res = await fetch(`${DJANGO_API_BASE}/api/wallet/positions/`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {'X-Requested-With': 'XMLHttpRequest'},
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setPositions(data.positions || []);
                    }
                } catch (err) {
                    console.error("Error fetching positions:", err);
                }
            } else if (activeTab === 'Live Orders') {
                try {
                    const res = await fetch(`${DJANGO_API_BASE}/api/wallet/orders/`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {'X-Requested-With': 'XMLHttpRequest'},
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setLiveOrders(data.orders || []);
                    }
                } catch (err) {
                    console.error("Error fetching live orders:", err);
                }
            }
        };

        fetchTabData();
    }, [activeTab]);

    // Cancel order function
    const cancelOrder = async (orderId) => {
        try {
            const res = await fetch(`${DJANGO_API_BASE}/api/wallet/cancel-order/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': Cookies.get('csrftoken'),
                },
                body: JSON.stringify({ order_id: orderId }),
            });
            
            if (res.ok) {
                // Refresh live orders after successful cancellation
                const ordersRes = await fetch(`${DJANGO_API_BASE}/api/wallet/orders/`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {'X-Requested-With': 'XMLHttpRequest'},
                });
                if (ordersRes.ok) {
                    const data = await ordersRes.json();
                    setLiveOrders(data.orders || []);
                }
            } else {
                console.error('Failed to cancel order');
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
        }
    };

    if (loading) {
        return <main className="main-content"> <div>Loading Wallet... </div> </main>;
    }

    if (error) {
        return <main className="main-content"> <div>Error: {error.message}</div> </main>
    }

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
            <div className="wallet-container">
                {/* Overview: balance on left, chart on right */}
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
                        <div className="wallet-balance-value">{(balance || 0).toFixed(2)} pts</div>
                    </div>

                    <div className="wallet-balance-item">
                        <div className="wallet-balance-label">Currently allocated</div>
                        <div className="wallet-balance-value">{(allocated || 0).toFixed(2)} pts</div>
                    </div>

                    <div className="wallet-balance-item">
                        <div className="wallet-balance-label">Available for trading</div>
                        <div className="wallet-balance-value">{(available || 0).toFixed(2)} pts</div>
                    </div>
                    </div>
                </div>

                <div className="wallet-chart-container" aria-hidden="true">
                    <PieChart allocated={allocated || 0} unallocated={available || 0} />
                </div>
                </section>

                {/* Content */}
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
                    <br></br><br></br>
                    Your balance and positions are updated in real-time as markets resolve. You can review your transaction
                    history to track your prediction accuracy and trading patterns over time.
                </p>

                {/* Tabs */}
                <div className="wallet-tabs" role="tablist" aria-label="Wallet tabs">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'Transactions'}
                        className={`selection-tab ${activeTab === 'Transactions' ? 'wallet-tab--active' : ''}`}
                        onClick={() => setActiveTab('Transactions')}
                    >
                    Transactions
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'Positions'}
                        className={`selection-tab ${activeTab === 'Positions' ? 'wallet-tab--active' : ''}`}
                        onClick={() => setActiveTab('Positions')}
                    >
                    Positions
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'Live Orders'}
                        className={`selection-tab ${activeTab === 'Live Orders' ? 'wallet-tab--active' : ''}`}
                        onClick={() => setActiveTab('Live Orders')}
                    >
                    Live Orders
                    </button>
                </div>
                {activeTab === 'Transactions' ? (
                    <div className="wallet-transactions-table transactions-table" role="table" aria-label="Transaction history">
                        <div className="wallet-transactions-header" role="row">
                        <div className="wallet-table-col">Date/Time</div>
                        <div className="wallet-table-col">Event</div>
                        <div className="wallet-table-col">Side</div>
                        <div className="wallet-table-col">Buy/Sell</div>
                        <div className="wallet-table-col">Shares</div>
                        <div className="wallet-table-col">Price</div>
                        <div className="wallet-table-col">Cash Effect</div>
                        </div>

                        <div className="wallet-transactions-body" role="rowgroup">
                        {transactions.map((tx, idx) => (
                            <div
                                key={tx.id}
                                className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`}
                                role="row"
                            >
                                <div className="wallet-table-col" role="cell">
                                    <div className="session-title">{tx.timestamp}</div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                    <div className="event-text">{tx.event_name}</div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                    <div className={`side-badge ${tx.share_type.toLowerCase()}`}>
                                        {tx.share_type}
                                    </div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                    <div className={`trade-type ${tx.order_type.toLowerCase()}`}>
                                        {tx.order_type}
                                    </div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                    <div className="shares-quantity">
                                        {tx.quantity}
                                    </div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                    <span className={`price-amount ${tx.share_type.toLowerCase()}`}>
                                        ${tx.price.toFixed(2)}
                                    </span>
                                </div>

                                <div
                                    className={`wallet-table-col col-cash-effect ${
                                        tx.cash_effect >= 0 ? 'col-cash--positive' : 'col-cash--negative'
                                    }`}
                                    role="cell"
                                >
                                {tx.cash_effect >= 0 ? `+$${tx.cash_effect.toFixed(2)}` : `-$${Math.abs(tx.cash_effect).toFixed(2)}`}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                ) : activeTab === 'Positions' ? (
                    // Positions table
                    <div className="wallet-transactions-table positions-table" role="table" aria-label="Positions list">
                        <div className="wallet-transactions-header" role="row">
                        <div className="wallet-table-col">Market</div>
                        <div className="wallet-table-col">Side</div>
                        <div className="wallet-table-col">Avg Price</div>
                        <div className="wallet-table-col">Quantity</div>
                        </div>

                        <div className="wallet-transactions-body" role="rowgroup">
                        {positions.map((pos, idx) => (
                            <div
                                key={pos.id}
                                className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`}
                                role="row"
                            >
                                <div className="wallet-table-col" role="cell">
                                <div className="event-text">{pos.market_name}</div>
                                <div className="market-sub">{pos.event_name}</div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <div className={`side-badge ${pos.side.toLowerCase()}`}>
                                    {pos.side}
                                </div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <span className={`price-amount ${pos.side.toLowerCase()}`}>
                                    ${pos.avg_price.toFixed(2)}
                                </span>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <div className="shares-quantity">
                                    {pos.quantity}
                                </div>
                                </div>

                            </div>
                        ))}
                        </div>
                    </div>
                ) : (
                    // Live Orders table
                    <div className="wallet-transactions-table orders-table" role="table" aria-label="Live orders list">
                        <div className="wallet-transactions-header" role="row">
                        <div className="wallet-table-col">Market</div>
                        <div className="wallet-table-col">Type</div>
                        <div className="wallet-table-col">Side</div>
                        <div className="wallet-table-col">Price</div>
                        <div className="wallet-table-col">Quantity</div>
                        <div className="wallet-table-col">Status</div>
                        <div className="wallet-table-col">Actions</div>
                        </div>

                        <div className="wallet-transactions-body" role="rowgroup">
                        {liveOrders.map((order, idx) => (
                            <div
                                key={order.id}
                                className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`}
                                role="row"
                            >
                                <div className="wallet-table-col" role="cell">
                                    <div className="event-text">{order.market_name}</div>
                                    <div className="market-sub">{order.event_name}</div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                    <div className={`trade-type ${order.order_type.toLowerCase()}`}>
                                        {order.order_type}
                                    </div>
                                </div>
                                <div className="wallet-table-col" role="cell">
                                    <div className={`side-badge ${order.share_type.toLowerCase()}`}>
                                        {order.share_type}
                                    </div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <span className={`price-amount ${order.share_type.toLowerCase()}`}>
                                    ${order.price.toFixed(2)}
                                </span>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <div className="shares-quantity">
                                    {order.remaining_quantity} / {order.total_quantity}
                                </div>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <span className={`status-badge ${order.status.toLowerCase()}`}>
                                    {order.status}
                                </span>
                                </div>

                                <div className="wallet-table-col" role="cell">
                                <button
                                    className="cancel-order-btn"
                                    onClick={() => cancelOrder(order.id)}
                                    disabled={order.status !== 'ACTIVE'}
                                >
                                    Cancel
                                </button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
                </section>
            </div>
            </div>
        </div>
    );
}; 

export default Wallet;