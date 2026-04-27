import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faUsers } from '@fortawesome/free-solid-svg-icons';

import { Button } from '../buttons/Button';
import Badge from '../common/Badge'; // Ensure this relative path is correct for your directory structure
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

// ─── Settle components ───────────────────────────────────────────────────────

/**
 * Determines the appropriate badge colour for an event outcome.
 * @param {Object} event - The market event object.
 * @returns {string} The standard badge colour key.
 */
const getOutcomeColour = (event) => {
  if (!event.settled) return 'yellow';
  const outcome = event.winning_outcome?.toUpperCase();
  if (outcome === 'YES') return 'green';
  if (outcome === 'NO') return 'red';
  return 'blue';
};

/**
 * Determines the appropriate badge colour for the market status.
 * @param {string} status - The current market status.
 * @returns {string} The standard badge colour key.
 */
const getStatusColour = (status) => {
  const s = status.toUpperCase();
  if (s === 'ACTIVE' || s === 'OPEN') return 'green';
  if (s === 'CLOSED' || s === 'SETTLED') return 'blue';
  return 'grey';
};

/**
 * Renders a single row representing an event within the settlement table.
 */
const SettleEventRow = ({ event, actionLoading, onSettleEvent }) => (
  <div className={`settle-events-table__row ${event.settled ? 'settle-events-table__row--settled' : ''}`}>
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
      <Badge
        label={event.settled ? event.winning_outcome : 'PENDING'}
        colour={getOutcomeColour(event)}
      />
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
);

/**
 * Displays a market and its associated events for settlement.
 */
export const MarketSettleCard = ({ market, actionLoading, onSettleEvent }) => (
  <article className="settle-market-card">
    <header className="settle-market-card__header">
      <div className="settle-market-card__header-left">
        <span className="settle-market-card__label">Market</span>
        <h2 className="settle-market-card__title">{market.market_name}</h2>
      </div>
      <Badge label={market.status} colour={getStatusColour(market.status)} />
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
        <SettleEventRow
          key={event.id}
          event={event}
          actionLoading={actionLoading}
          onSettleEvent={onSettleEvent}
        />
      ))}
    </div>
  </article>
);

MarketSettleCard.propTypes = {
  market: PropTypes.object.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  onSettleEvent: PropTypes.func.isRequired,
};

SettleEventRow.propTypes = {
  event: PropTypes.object.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  onSettleEvent: PropTypes.func.isRequired,
};

/**
 * Renders a list of markets pending settlement.
 */
export const SettleMarketsList = ({ markets, loading, actionLoading, onSettleEvent }) => {
  if (loading) return <div className="loading">Loading markets...</div>;
  if (!markets?.length) return <div className="settle-empty">No markets found.</div>;

  return (
    <div className="settle-markets-list">
      {markets.map(market => (
        <MarketSettleCard
          key={market.id}
          market={market}
          actionLoading={actionLoading}
          onSettleEvent={onSettleEvent}
        />
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