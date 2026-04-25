import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OrderBook from '../../../services/orderbook/OrderBook';
import { useEventOrderbookData } from '../../../hooks/useEventOrderBook';

/**
 * Renders a single event row and its expandable inline orderbook.
 * @param {Object} props - Component properties.
 * @returns {JSX.Element}
 */
export const EventRow = ({ event, index, onSelectEvent, onEventDataUpdate, isOpen, openShareType, onToggleOrderbook }) => {
  const eventId = event.eventId || index + 1;
  const { orderbookData, connectionStatus, lastUpdated, bestAsk } = useEventOrderbookData(eventId);
  const [mounted, setMounted] = useState(isOpen);

  const hasLiveData = bestAsk !== null && bestAsk !== undefined;
  const liveChance = hasLiveData ? `${(bestAsk * 100).toFixed(1)}%` : '-';
  const bestBid = orderbookData?.bids?.length > 0 ? Math.max(...orderbookData.bids.map(b => b.price)) : null;

  // Mount/unmount helper to standardise the behaviour of CSS height transitions
  useEffect(() => {
    if (isOpen) setMounted(true);
    else {
      const timeoutId = setTimeout(() => setMounted(false), 360);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  useEffect(() => {
    if (onEventDataUpdate && orderbookData) {
      onEventDataUpdate(eventId, { orderbookData, bestBid, bestAsk, connectionStatus, lastUpdated });
    }
  }, [orderbookData, bestBid, bestAsk, connectionStatus, lastUpdated, onEventDataUpdate, eventId]);

  return (
    <>
      <div className={`wallet-transactions-row ${index % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`} role="row">
        <div className="wallet-table-col" role="cell">
          <div className="market-events__outcome-name">{event.outcomeName}</div>
          <div className="market-events__outcome-price">{hasLiveData ? `${(bestAsk * 100).toFixed(1)}c` : '-'}</div>
        </div>
        <div className="wallet-table-col" role="cell">
          <span className={hasLiveData ? 'live-chance' : 'static-chance'}>{liveChance}</span>
          {hasLiveData && <span className="live-indicator" title={`Updated: ${lastUpdated}`}>●</span>}
        </div>
        <div className="wallet-table-col" role="cell">
          <div className="market-events__actions-inner">
            <button className="place-position__choice-button place-position__choice-button--yes market-events__btn" onClick={() => onSelectEvent(event, 'yes')}>Yes</button>
            <button className="place-position__choice-button place-position__choice-button--no market-events__btn" onClick={() => onSelectEvent(event, 'no')}>No</button>
          </div>
        </div>
        <div className="wallet-table-col" role="cell">
          <div className="orderbook-buttons">
            <button className={`market-events__btn orderbook-btn ${isOpen && openShareType === 'YES' ? 'active' : ''}`} onClick={() => onToggleOrderbook(eventId, 'YES')}>
              YES order book <span className="iconify" data-icon="ri:arrow-down-s-line" />
            </button>
            <button className={`market-events__btn orderbook-btn ${isOpen && openShareType === 'NO' ? 'active' : ''}`} onClick={() => onToggleOrderbook(eventId, 'NO')}>
              NO order book <span className="iconify" data-icon="ri:arrow-down-s-line" />
            </button>
          </div>
        </div>
      </div>

      {mounted && (
        <div className={`orderbook-inline-wrapper ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} style={{ width: '100%', padding: '10px 0' }}>
          <OrderBook inline isOpen={true} onClose={() => onToggleOrderbook(null, null)} eventId={eventId} eventName={event.outcomeName} shareType={openShareType || 'YES'} orderbookData={orderbookData} connectionStatus={connectionStatus} lastUpdated={lastUpdated} />
        </div>
      )}
    </>
  );
};

EventRow.propTypes = {
  event: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  onEventDataUpdate: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  openShareType: PropTypes.string,
  onToggleOrderbook: PropTypes.func.isRequired,
};