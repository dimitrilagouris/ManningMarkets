// TransactionsTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a historical list of wallet transactions.
 * * @param {Object} props
 * @param {Array} props.transactions - List of completed trade records.
 * @returns {JSX.Element}
 */
const TransactionsTable = ({ transactions }) => (
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
                <div key={tx.id} className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`} role="row">
                    <div className="wallet-table-col" role="cell"><div className="session-title">{tx.timestamp}</div></div>
                    <div className="wallet-table-col" role="cell"><div className="event-text">{tx.event_name}</div></div>
                    <div className="wallet-table-col" role="cell"><div className={`side-badge ${tx.share_type.toLowerCase()}`}>{tx.share_type}</div></div>
                    <div className="wallet-table-col" role="cell"><div className={`trade-type ${tx.order_type.toLowerCase()}`}>{tx.order_type}</div></div>
                    <div className="wallet-table-col" role="cell"><div className="shares-quantity">{tx.quantity}</div></div>
                    <div className="wallet-table-col" role="cell"><span className={`price-amount ${tx.share_type.toLowerCase()}`}>${tx.price.toFixed(2)}</span></div>
                    <div className={`wallet-table-col col-cash-effect ${tx.cash_effect >= 0 ? 'col-cash--positive' : 'col-cash--negative'}`} role="cell">
                        {tx.cash_effect >= 0 ? `+$${tx.cash_effect.toFixed(2)}` : `-$${Math.abs(tx.cash_effect).toFixed(2)}`}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

TransactionsTable.propTypes = {
    transactions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        timestamp: PropTypes.string.isRequired,
        event_name: PropTypes.string.isRequired,
        share_type: PropTypes.string.isRequired,
        order_type: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        price: PropTypes.number.isRequired,
        cash_effect: PropTypes.number.isRequired,
    })).isRequired,
};

export default TransactionsTable;