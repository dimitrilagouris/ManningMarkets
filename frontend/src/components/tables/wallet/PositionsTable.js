// PositionsTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import Badge from '../../common/Badge';
import '../table.css';

/**
 * Maps a position side to its corresponding badge colour.
 * @param {string} side - The position side (e.g., 'YES', 'NO').
 * @returns {string} The badge colour identifier.
 */
const getSideColour = (side) => {
    const type = (side || '').toUpperCase();
    if (type === 'YES') return 'green';
    if (type === 'NO') return 'red';
    return 'grey';
};

/**
 * Renders a single row within the positions table.
 * @param {Object} props
 * @param {Object} props.position - Position data object.
 * @param {boolean} props.isAlt - Whether to apply alternate row styling.
 * @returns {React.JSX.Element}
 */
const PositionRow = ({ position, isAlt }) => {
    const rowClass = `table-row ${isAlt ? 'table-row--alt' : ''}`;
    const sideLower = (position.side || '').toLowerCase();
    const formattedPrice = typeof position.avg_price === 'number'
        ? `$${position.avg_price.toFixed(2)}`
        : '$0.00';

    return (
        <div className={rowClass} role="row">
            <div className="table-col table-col--column" role="cell">
                <div className="event-text">{position.market_name || position.event_name}</div>
                {position.market_name && (
                    <div className="market-sub">{position.event_name}</div>
                )}
            </div>
            <div className="table-col" role="cell">
                <Badge label={position.side} colour={getSideColour(position.side)} />
            </div>
            <div className="table-col" role="cell">
                <span className={`price-amount ${sideLower}`}>{formattedPrice}</span>
            </div>
            <div className="table-col" role="cell">
                <div className="shares-quantity">{position.quantity}</div>
            </div>
        </div>
    );
};

const PositionShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    market_name: PropTypes.string,
    event_name: PropTypes.string.isRequired,
    side: PropTypes.string.isRequired,
    avg_price: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
});

PositionRow.propTypes = {
    position: PositionShape.isRequired,
    isAlt: PropTypes.bool.isRequired,
};

/**
 * Renders the user's current active market positions.
 * @param {Object} props
 * @param {Array} props.positions - List of active position objects.
 * @returns {React.JSX.Element}
 */
const PositionsTable = ({ positions = [] }) => (
    <div className="table-container positions-table" role="table" aria-label="Positions list">
        <div className="table-header" role="row">
            <div className="table-col">Market</div>
            <div className="table-col">Side</div>
            <div className="table-col">Avg Price</div>
            <div className="table-col">Quantity</div>
        </div>
        <div className="table-body" role="rowgroup">
            {positions.map((pos, idx) => (
                <PositionRow
                    key={pos.id}
                    position={pos}
                    isAlt={idx % 2 === 1}
                />
            ))}
        </div>
    </div>
);

PositionsTable.propTypes = {
    positions: PropTypes.arrayOf(PositionShape),
};

export default PositionsTable;