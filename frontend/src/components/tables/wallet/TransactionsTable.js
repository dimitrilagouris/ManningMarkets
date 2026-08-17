// TransactionsTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../../common/Badge';
import '../table.css';

/**
 * Maps a share type to its corresponding badge colour.
 * @param {string} shareType - The side of the trade (e.g., 'YES', 'NO').
 * @returns {string} The badge colour identifier.
 */
const getSideColour = (shareType) => {
    const type = (shareType || '').toUpperCase();
    if (type === 'YES') return 'green';
    if (type === 'NO') return 'red';
    return 'grey';
};

/**
 * Renders a single row within the transaction history table.
 * @param {Object} props
 * @param {Object} props.transaction - Transaction record object.
 * @param {boolean} props.isAlt - Whether to apply alternate row styling.
 * @returns {React.JSX.Element}
 */
const TransactionRow = ({ transaction, isAlt }) => {
    const rowClass = `table-row ${isAlt ? 'table-row--alt' : ''}`;
    const shareLower = (transaction.share_type || '').toLowerCase();
    const orderLower = (transaction.order_type || '').toLowerCase();
    const priceFormatted = typeof transaction.price === 'number'
        ? `$${transaction.price.toFixed(2)}`
        : '$0.00';
    const isPositive = (transaction.cash_effect || 0) >= 0;
    const cashFormatted = typeof transaction.cash_effect === 'number'
        ? `${isPositive ? '+' : '-'}$${Math.abs(transaction.cash_effect).toFixed(2)}`
        : '$0.00';

    return (
        <div className={rowClass} role="row">
            <div className="table-col" role="cell">
                <div className="session-title">{transaction.timestamp}</div>
            </div>
            <div className="table-col table-col--column" role="cell">
                <div className="event-text">{transaction.market_name || transaction.event_name}</div>
                {transaction.market_name && (
                    <div className="market-sub">{transaction.event_name}</div>
                )}
            </div>
            <div className="table-col" role="cell">
                <Badge label={transaction.share_type} colour={getSideColour(transaction.share_type)} />
            </div>
            <div className="table-col" role="cell">
                <div className={`trade-type ${orderLower}`}>{transaction.order_type}</div>
            </div>
            <div className="table-col" role="cell">
                <div className="shares-quantity">{transaction.quantity}</div>
            </div>
            <div className="table-col" role="cell">
                <span className={`price-amount ${shareLower}`}>{priceFormatted}</span>
            </div>
            <div className="table-col" role="cell">
                <span className={`col-cash-effect ${isPositive ? 'col-cash--positive' : 'col-cash--negative'}`}>
                    {cashFormatted}
                </span>
            </div>
        </div>
    );
};

const TransactionShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    timestamp: PropTypes.string.isRequired,
    event_name: PropTypes.string.isRequired,
    market_name: PropTypes.string,
    share_type: PropTypes.string.isRequired,
    order_type: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    price: PropTypes.number.isRequired,
    cash_effect: PropTypes.number.isRequired,
});

TransactionRow.propTypes = {
    transaction: TransactionShape.isRequired,
    isAlt: PropTypes.bool.isRequired,
};

/**
 * Renders a historical list of wallet transactions.
 * @param {Object} props
 * @param {Array} props.transactions - List of completed trade records.
 * @returns {React.JSX.Element}
 */
const TransactionsTable = ({ transactions = [] }) => (
    <div className="table-container transactions-table" role="table" aria-label="Transaction history">
        <div className="table-header" role="row">
            <div className="table-col">Date/Time</div>
            <div className="table-col">Market</div>
            <div className="table-col">Side</div>
            <div className="table-col">Buy/Sell</div>
            <div className="table-col">Shares</div>
            <div className="table-col">Price</div>
            <div className="table-col">Cash Effect</div>
        </div>
        <div className="table-body" role="rowgroup">
            {transactions.map((tx, idx) => (
                <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    isAlt={idx % 2 === 1}
                />
            ))}
        </div>
    </div>
);

TransactionsTable.propTypes = {
    transactions: PropTypes.arrayOf(TransactionShape),
};

export default TransactionsTable;