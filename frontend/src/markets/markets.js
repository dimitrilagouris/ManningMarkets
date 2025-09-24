// Market.jsx
import React from 'react';
import './markets.css';
import PropTypes from 'prop-types';

const slugify = (str = '') =>
  String(str)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function Market({ marketName, events, volume }) {
  const regionId = `market-${slugify(marketName)}`;
  const isSingle = events.length === 1;
  const singleEvent = isSingle ? events[0] : null;

  return (
    <section className={`market ${isSingle ? 'market--single' : ''}`} aria-labelledby={regionId}>
      <header className="market__header">
        <h3 id={regionId} className="market__name">{marketName}</h3>

        {isSingle && (
          <div className="market__percent" aria-hidden="true">
            {singleEvent.odds}
          </div>
        )}
      </header>

      <div
        className="market__events"
        tabIndex="0"
        role="list"
        aria-label={`${marketName} events`}
      >
        {events.map((ev, i) => {
          if (isSingle) {
            return (
              <div className="market__event market__event--single" role="listitem" key={i}>
                <div className="event__name">{ev.name}</div>

                <div
                  className="event__buttons event__buttons--single"
                  role="group"
                  aria-label={`${ev.name} actions`}
                >
                  <button
                    type="button"
                    className="event__button event__button--yes"
                    onClick={ev.onYesClick}
                    aria-label={`Bet yes on ${ev.name}`}
                  >
                    Yes
                  </button>

                  <button
                    type="button"
                    className="event__button event__button--no"
                    onClick={ev.onNoClick}
                    aria-label={`Bet no on ${ev.name}`}
                  >
                    No
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="market__event" role="listitem" key={i}>
              <div className="event__info">
                <div className="event__name">{ev.name}</div>
                <div className="event__odds" aria-hidden="true">{ev.odds}</div>
              </div>

              <div
                className="event__buttons"
                role="group"
                aria-label={`${ev.name} actions`}
              >
                <button
                  type="button"
                  className="event__button event__button--yes"
                  onClick={ev.onYesClick}
                  aria-label={`Bet yes on ${ev.name}`}
                >
                  Yes
                </button>

                <button
                  type="button"
                  className="event__button event__button--no"
                  onClick={ev.onNoClick}
                  aria-label={`Bet no on ${ev.name}`}
                >
                  No
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="market__footer">
        <div className="market__volume">{volume}</div>
      </footer>
    </section>
  );
}

Market.propTypes = {
  marketName: PropTypes.string.isRequired,
  volume: PropTypes.string,
  events: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      odds: PropTypes.string,
      onYesClick: PropTypes.func,
      onNoClick: PropTypes.func,
    })
  ).isRequired,
};

Market.defaultProps = {
  volume: '',
};

export default Market;
