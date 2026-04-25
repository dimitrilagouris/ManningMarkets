import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

import { Button } from '../../components/buttons/Button';
import './markets.css';

/**
 * @typedef {Object} Event
 * @property {number} id
 * @property {string} name
 * @property {number} [price]
 */

/**
 * @typedef {Object} MarketData
 * @property {number} id
 * @property {string} name
 * @property {number} [market_volume]
 * @property {Event[]} events
 */

/**
 * Renders a market overview card displaying its associated events.
 * @param {Object} props
 * @param {MarketData} props.market
 * @returns {JSX.Element}
 */
function Market({ market }) {
    const { id, name, market_volume, events } = market;
    const market_id = `market-${id}`;
    const navigate = useNavigate();

    /** @type {React.MouseEventHandler<HTMLElement>} */
    const navigateToMarket = () => navigate(`/market/${id}`);

    return (
        <section className="market" aria-labelledby={market_id}>
            <header className="market__header">
                <h3 
                    id={market_id} 
                    className="market__name market__name--clickable" 
                    onClick={navigateToMarket}
                    style={{ cursor: 'pointer' }}
                    title="Click to view market"
                >
                    {name}
                </h3>
            </header>

            <div className="market__events" tabIndex="0" role="list" aria-label={`${market_id} events`}>
                {(events || []).map((ev) => (
                    <div className="market__event" role="listitem" key={ev.id}>
                        <div className="event__info">
                            <div 
                                className="event__name event__name--clickable" 
                                onClick={navigateToMarket}
                                style={{ cursor: 'pointer' }}
                                title="Click to view market"
                            >
                                {ev.name || 'Unnamed Event'}
                            </div>
                        </div>

                        <div className="event__buttons" role="group" aria-label={`${ev.id} actions`}>
                            <Button
                                height="short"
                                fill="light"
                                outline="none"
                                width="40px"
                                onClick={navigateToMarket}
                            >
                                Yes
                            </Button>

                            <Button
                                height="short"
                                fill="light"
                                outline="none"
                                width="40px"
                                onClick={navigateToMarket}
                            >
                                No
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <footer className="market__footer">
                <div className="market__volume">$ {market_volume}</div>
            </footer>
        </section>
    );
}

Market.propTypes = {
    market: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        market_volume: PropTypes.number,
        events: PropTypes.arrayOf(
            PropTypes.shape({
                id: PropTypes.number.isRequired,
                name: PropTypes.string.isRequired,
                price: PropTypes.number,
            })
        ).isRequired,
    }).isRequired,
};

Market.defaultProps = {
    market: {
        id: 0,
        name: 'Unnamed Market',
        market_volume: 0,
        events: []
    },
};

export default Market;