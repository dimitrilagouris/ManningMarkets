// Market.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './markets.css';
import PropTypes from 'prop-types';


function Market({market}) {
    const {id, name, volume, events} = market;
    const market_id = `market-${id}`;
    const navigate = useNavigate();

    const onMarketTitleClick = () => navigate(`/market/${id}`);

    return (
        <section className="market" aria-labelledby={market_id}>
            <header className="market__header">
                <h3 
                    id={market_id} 
                    className="market__name market__name--clickable" 
                    onClick={onMarketTitleClick}
                    style={{ cursor: 'pointer' }}
                    title="Click to view market"
                >
                    {name}
                </h3>
            </header>

            <div className="market__events" tabIndex="0" role="list" aria-label={`${market_id} events`}>
                {
                    (events || []).map((ev) => {
                        const onYesClick = () => navigate(`/market/${id}`);
                        const onNoClick = () => navigate(`/market/${id}`);
                        const onEventNameClick = () => navigate(`/market/${id}`);

                        return (
                            <div className="market__event" role="listitem" key={ev.id}>
                                <div className="event__info">
                                    <div 
                                        className="event__name event__name--clickable" 
                                        onClick={onEventNameClick}
                                        style={{ cursor: 'pointer' }}
                                        title="Click to view market"
                                    >
                                        {ev.name || 'Unnamed Event'}
                                    </div>
                                    <div className="event__odds" aria-hidden="true">${Number(ev.price || 0).toFixed(2)}</div>
                                </div>

                                <div
                                    className="event__buttons"
                                    role="group"
                                    aria-label={`${ev.id} actions`}
                                >
                                    <button
                                    type="button"
                                    className="event__button event__button--yes"
                                    onClick={onYesClick}
                                    aria-label={`Bet yes on ${ev.id}`}
                                    >
                                    Yes
                                    </button>

                                    <button
                                    type="button"
                                    className="event__button event__button--no"
                                    onClick={onNoClick}
                                    aria-label={`Bet no on ${ev.id}`}
                                    >
                                    No
                                    </button>
                                </div>
                            </div>
                        );


                    })
                }
            </div>

            <footer className="market__footer">
                <div className="market__volume">{volume}</div>
            </footer>

        </section>

    );

}

Market.propTypes = {
  market: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    volume: PropTypes.number,
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
    volume: 0,
    events: []
  },
};

export default Market;
