// LiveOrdersTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a list of open orders with a cancellation action.
 * * @param {Object} props
 * @param {Array} props.liveOrders - List of currently open orders.
 * @param {Function} props.onCancelOrder - Callback to trigger order cancellation.
 * @returns {JSX.Element}
 */
const LiveOrdersTable = ({ liveOrders, onCancelOrder }) => (
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
                <div key={order.id} className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`} role="row">
                    <div className="wallet-table-col" role="cell">
                        <div className="event-text">{order.market_name}</div>
                        <div className="market-sub">{order.event_name}</div>
                    </div>
                    <div className="wallet-table-col" role="cell"><div className={`trade-type ${order.order_type.toLowerCase()}`}>{order.order_type}</div></div>
                    <div className="wallet-table-col" role="cell"><div className={`side-badge ${order.share_type.toLowerCase()}`}>{order.share_type}</div></div>
                    <div className="wallet-table-col" role="cell"><span className={`price-amount ${order.share_type.toLowerCase()}`}>${order.price.toFixed(2)}</span></div>
                    <div className="wallet-table-col" role="cell"><div className="shares-quantity">{order.remaining_quantity} / {order.total_quantity}</div></div>
                    <div className="wallet-table-col" role="cell"><span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span></div>
                    <div className="wallet-table-col" role="cell">
                        <button className="cancel-order-btn" onClick={() => onCancelOrder(order.id)} disabled={order.status !== 'ACTIVE'}>
                            Cancel
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

LiveOrdersTable.propTypes = {
    liveOrders: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        market_name: PropTypes.string.isRequired,
        event_name: PropTypes.string.isRequired,
        order_type: PropTypes.string.isRequired,
        share_type: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        remaining_quantity: PropTypes.number.isRequired,
        total_quantity: PropTypes.number.isRequired,
        status: PropTypes.string.isRequired,
    })).isRequired,
    onCancelOrder: PropTypes.func.isRequired,
};

export default LiveOrdersTable;