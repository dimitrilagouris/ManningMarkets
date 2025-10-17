// Wallet.jsx
import React, {useEffect, useState, useMemo} from "react";
import { DJANGO_API_BASE } from "../config";

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
          'rgba(0,0,0,0.06)'
        ],
        hoverBackgroundColor: [
          'var(--usyd-red-dark)',
          'rgba(0,0,0,0.12)'
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
    const [balance, setBalance] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [positions, setPositions] = useState([]);

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
                        <div className="wallet-balance-value">{balance} pts</div>
                    </div>

                    <div className="wallet-balance-item">
                        <div className="wallet-balance-label">Currently allocated</div>
                        <div className="wallet-balance-value">{balance} pts</div>
                    </div>

                    <div className="wallet-balance-item">
                        <div className="wallet-balance-label">Available for trading</div>
                        <div className="wallet-balance-value">{balance} pts</div>
                    </div>
                    </div>
                </div>

                <div className="wallet-chart-container" aria-hidden="true">
                    <PieChart allocated={balance} unallocated={balance} />
                </div>
                </section>

                {/* Content */}
                <section className="wallet-content-section" aria-labelledby="wallet-content-heading">
                <div className="wallet-content-header">
                    <h2 id="wallet-content-heading" className="wallet-content-title">
                    {activeTab === 'Transactions' ? 'Transaction history' : 'Current positions'}
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
                        className={`wallet-tab ${activeTab === 'Transactions' ? 'wallet-tab--active' : ''}`}
                        onClick={() => setActiveTab('Transactions')}
                    >
                    Transactions
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTab === 'Positions'}
                        className={`wallet-tab ${activeTab === 'Positions' ? 'wallet-tab--active' : ''}`}
                        onClick={() => setActiveTab('Positions')}
                    >
                    Positions
                    </button>
                </div>
                {activeTab === 'Transactions' ? (
                    <div className="wallet-transactions-table" role="table" aria-label="Transaction history">
                        <div className="wallet-transactions-header" role="row">
                        <div className="wallet-table-col">Date</div>
                        <div className="wallet-table-col">Event</div>
                        <div className="wallet-table-col">Quantity</div>
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
                                <div className="event-text">{tx.event}</div>
                                </div>

                                <div
                                    className={`wallet-table-col col-quantity-value ${
                                        (tx.quantity || 0) >= 0 ? 'col-quantity--positive' : 'col-quantity--negative'
                                    }`}
                                    role="cell"
                                    aria-label={`Quantity ${tx.quantity >= 0 ? 'positive' : 'negative'}`}
                                >
                                {(tx.quantity || 0) >= 0 ? `+${tx.quantity}` : tx.quantity}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                ) : (
                    // Positions table now has 3 columns with market taking up most space
                    <div className="wallet-positions-table" role="table" aria-label="Positions list">
                        <div className="wallet-positions-header" role="row">
                        <div className="col-market">Market</div>
                        <div className="col-odds">Odds</div>
                        <div className="col-staked">Staked</div>
                        </div>

                        <div className="wallet-positions-body" role="rowgroup">
                        {positions.map((pos, idx) => (
                            <div
                                key={pos.id}
                                className={`wallet-positions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`}
                                role="row"
                            >
                                <div className="col-market" role="cell">
                                <div className="market-title">{pos.market}</div>
                                <div className="market-sub">Position: {pos.position}</div>
                                </div>

                                <div className="col-odds" role="cell" aria-label={`Odds: ${pos.currentOdds}`}>
                                {pos.currentOdds}
                                </div>

                                <div className="col-staked" role="cell" aria-label={`Staked ${pos.amount} points`}>
                                {fmt(pos.amount)} pts
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