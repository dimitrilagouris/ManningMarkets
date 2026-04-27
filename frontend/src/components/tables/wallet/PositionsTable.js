// PositionsTable.jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders the user's current active market positions.
 * * @param {Object} props
 * @param {Array} props.positions - List of active position objects.
 * @returns {JSX.Element}
 */
const PositionsTable = ({ positions }) => (
    <div className="wallet-transactions-table positions-table" role="table" aria-label="Positions list">
        <div className="wallet-transactions-header" role="row">
            <div className="wallet-table-col">Market</div>
            <div className="wallet-table-col">Side</div>
            <div className="wallet-table-col">Avg Price</div>
            <div className="wallet-table-col">Quantity</div>
        </div>
        <div className="wallet-transactions-body" role="rowgroup">
            {positions.map((pos, idx) => (
                <div key={pos.id} className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`} role="row">
                    <div className="wallet-table-col" role="cell">
                        <div className="event-text">{pos.market_name}</div>
                        <div className="market-sub">{pos.event_name}</div>
                    </div>
                    <div className="wallet-table-col" role="cell"><div className={`side-badge ${pos.side.toLowerCase()}`}>{pos.side}</div></div>
                    <div className="wallet-table-col" role="cell"><span className={`price-amount ${pos.side.toLowerCase()}`}>${pos.avg_price.toFixed(2)}</span></div>
                    <div className="wallet-table-col" role="cell"><div className="shares-quantity">{pos.quantity}</div></div>
                </div>
            ))}
        </div>
    </div>
);

PositionsTable.propTypes = {
    positions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        market_name: PropTypes.string.isRequired,
        event_name: PropTypes.string.isRequired,
        side: PropTypes.string.isRequired,
        avg_price: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired,
    })).isRequired,
};

export default PositionsTable;