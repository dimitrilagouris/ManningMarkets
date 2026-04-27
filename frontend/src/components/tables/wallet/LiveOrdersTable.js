// LiveOrdersTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../../common/Badge';
import { Button } from '../../buttons/Button';
import '../table.css';

/**
 * Maps a share type to its corresponding badge colour.
 * @param {string} shareType - The side of the trade (e.g., 'YES', 'NO').
 * @returns {string} The badge colour identifier.
 */
const getSideColour = (shareType) => {
    const type = shareType.toUpperCase();
    if (type === 'YES') return 'green';
    if (type === 'NO') return 'red';
    return 'grey';
};

/**
 * Maps an order status to its corresponding badge colour.
 * @param {string} status - The current state of the order.
 * @returns {string} The badge colour identifier.
 */
const getStatusColour = (status) => {
    const currentStatus = status.toUpperCase();
    if (currentStatus === 'ACTIVE') return 'green';
    if (currentStatus === 'PARTIALLY_FILLED') return 'yellow';
    return 'grey';
};

const LiveOrderRow = ({ order, isAlt, onCancel }) => {
    const isCancelDisabled = order.status !== 'ACTIVE';
    const rowClass = `table-row ${isAlt ? 'table-row--alt' : ''}`;

    return (
        <div className={rowClass} role="row">
            <div className="table-col table-col--column" role="cell">
                <div className="event-text">{order.market_name}</div>
                <div className="market-sub">{order.event_name}</div>
            </div>
            <div className="table-col" role="cell">
                <div className={`trade-type ${order.order_type.toLowerCase()}`}>{order.order_type}</div>
            </div>
            <div className="table-col" role="cell">
                <Badge label={order.share_type} colour={getSideColour(order.share_type)} />
            </div>
            <div className="table-col" role="cell">
                <span className={`price-amount ${order.share_type.toLowerCase()}`}>${order.price.toFixed(2)}</span>
            </div>
            <div className="table-col" role="cell">
                <div className="shares-quantity">{order.remaining_quantity} / {order.total_quantity}</div>
            </div>
            <div className="table-col" role="cell">
                <Badge label={order.status} colour={getStatusColour(order.status)} />
            </div>
            <div className="table-col" role="cell">
                <Button
                    height="x-short"
                    fill="primary"
                    onClick={() => onCancel(order.id)}
                    disabled={isCancelDisabled}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
};

/**
 * Displays a structured table of active orders.
 * @param {Object} props
 * @param {Array} props.liveOrders - List of currently open orders.
 * @param {Function} props.onCancelOrder - Callback to trigger order cancellation.
 * @returns {JSX.Element}
 */
const LiveOrdersTable = ({ liveOrders, onCancelOrder }) => (
    <div className="table-container orders-table" role="table" aria-label="Live orders list">
        <div className="table-header" role="row">
            <div className="table-col">Market</div>
            <div className="table-col">Type</div>
            <div className="table-col">Side</div>
            <div className="table-col">Price</div>
            <div className="table-col">Quantity</div>
            <div className="table-col">Status</div>
            <div className="table-col">Actions</div>
        </div>
        <div className="table-body" role="rowgroup">
            {liveOrders.map((order, idx) => (
                <LiveOrderRow
                    key={order.id}
                    order={order}
                    isAlt={idx % 2 === 1}
                    onCancel={onCancelOrder}
                />
            ))}
        </div>
    </div>
);

const OrderShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    market_name: PropTypes.string.isRequired,
    event_name: PropTypes.string.isRequired,
    order_type: PropTypes.string.isRequired,
    share_type: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    remaining_quantity: PropTypes.number.isRequired,
    total_quantity: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
});

LiveOrderRow.propTypes = {
    order: OrderShape.isRequired,
    isAlt: PropTypes.bool.isRequired,
    onCancel: PropTypes.func.isRequired,
};

LiveOrdersTable.propTypes = {
    liveOrders: PropTypes.arrayOf(OrderShape).isRequired,
    onCancelOrder: PropTypes.func.isRequired,
};

export default LiveOrdersTable;