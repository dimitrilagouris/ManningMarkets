import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faUsers, faCheck } from '@fortawesome/free-solid-svg-icons';

import { Button } from '../buttons/Button';
import './MarketCard.css';

export const MarketCard = ({
  title,
  icon = faMapMarkerAlt,
  col1Content,
  col2Content,
  col3Content,
  topRightAction,
  children
}) => (
  <article className="market-card">
    <header className="market-card__header">
      <h3 className="market-card__title">{title}</h3>
      {topRightAction && <div className="market-card__action">{topRightAction}</div>}
    </header>

    <div className="market-card__details">
      <div className="market-card__col market-card__col--first">
        <FontAwesomeIcon icon={icon} className="market-card__icon" />
        <div className="market-card__text">{col1Content}</div>
      </div>
      <div className="market-card__divider" />
      <div className="market-card__col">
        <div className="market-card__text">{col2Content}</div>
      </div>
      {col3Content && (
        <>
          <div className="market-card__divider" />
          <div className="market-card__col">
            <div className="market-card__text">{col3Content}</div>
          </div>
        </>
      )}
    </div>

    {children && (
      <div className="market-card__nested-content">
        {children}
      </div>
    )}
  </article>
);

MarketCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.object,
  col1Content: PropTypes.node.isRequired,
  col2Content: PropTypes.node.isRequired,
  col3Content: PropTypes.node,
  topRightAction: PropTypes.node,
  children: PropTypes.node,
};

// ─── Settle components (moved from marketManagement.jsx) ─────────────────────

export const MarketSettleCard = ({ market, actionLoading, onSettleEvent }) => (
  <article className="settle-market-card">
    <header className="settle-market-card__header">
      <div className="settle-market-card__header-left">
        <span className="settle-market-card__label">Market</span>
        <h2 className="settle-market-card__title">{market.market_name}</h2>
      </div>
      <span className={`status-badge status-badge--${market.status.toLowerCase()}`}>
        {market.status}
      </span>
    </header>

    <div className="settle-events-table">
      <div className="settle-events-table__head">
        <span>Event</span>
        <span>Expiration</span>
        <span>Participants</span>
        <span>Outcome</span>
        <span></span>
      </div>

      {(market.events || []).map((event) => (
        <div
          key={event.id}
          className={`settle-events-table__row ${event.settled ? 'settle-events-table__row--settled' : ''}`}
        >
          <span className="settle-events-table__event-name">{event.event_name}</span>

          <span className="settle-events-table__cell">
            {new Date(event.expiration_date).toLocaleDateString('en-AU', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>

          <span className="settle-events-table__cell">
            <FontAwesomeIcon icon={faUsers} className="settle-events-table__meta-icon" />
            {event.participants || 0}
          </span>

          <span className="settle-events-table__cell">
            {event.settled ? (
              <span className="settle-outcome-pill settle-outcome-pill--settled">
                <FontAwesomeIcon icon={faCheck} />
                {event.winning_outcome}
              </span>
            ) : (
              <span className="settle-outcome-pill settle-outcome-pill--pending">Pending</span>
            )}
          </span>

          <span className="settle-events-table__actions">
            {event.settled ? (
              <span className="settle-settled-date">
                Settled {new Date(event.settled_at).toLocaleDateString('en-AU', {
                  day: 'numeric', month: 'short',
                })}
              </span>
            ) : (
              <div className="settle-action-btns">
                <Button height="standard" fill="primary" textColor="light"
                  onClick={() => !actionLoading && onSettleEvent(event.id, 'YES')}>YES</Button>
                <Button height="standard" fill="none" outline="dark" textColor="dark"
                  onClick={() => !actionLoading && onSettleEvent(event.id, 'NO')}>NO</Button>
              </div>
            )}
          </span>
        </div>
      ))}
    </div>
  </article>
);

MarketSettleCard.propTypes = {
  market: PropTypes.object.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  onSettleEvent: PropTypes.func.isRequired,
};

export const SettleMarketsList = ({ markets, loading, actionLoading, onSettleEvent }) => {
  if (loading) return <div className="loading">Loading markets...</div>;
  if (!markets?.length) return <div className="settle-empty">No markets found.</div>;

  return (
    <div className="settle-markets-list">
      {markets.map(market => (
        <MarketSettleCard key={market.id} market={market} actionLoading={actionLoading} onSettleEvent={onSettleEvent} />
      ))}
    </div>
  );
};

SettleMarketsList.propTypes = {
  markets: PropTypes.array,
  loading: PropTypes.bool.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  onSettleEvent: PropTypes.func.isRequired,
};