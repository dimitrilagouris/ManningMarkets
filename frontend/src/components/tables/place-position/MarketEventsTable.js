import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import OrderBook from '../../../services/orderbook/OrderBook';
import { WS_BASE_URL } from '../../../config';
import { useWebSocket } from '../../../hooks/useWebsocket';
import { Button } from '../../buttons/Button';

const gridStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1.5fr', alignItems: 'center' };

/**
 * @typedef {Object} EventData
 * @property {number} [eventId]
 * @property {string} outcomeName
 */

/**
 * Renders a single event row and its expandable inline orderbook.
 * @param {Object} props
 * @param {EventData} props.event
 * @param {number} props.index
 * @param {function(EventData, string): void} props.onSelectEvent
 * @param {function(number, Object): void} [props.onEventDataUpdate]
 * @param {boolean} props.isOpen
 * @param {string|null} props.openShareType
 * @param {function(number|null, string|null): void} props.onToggleOrderbook
 * @returns {JSX.Element}
 */
const EventRow = ({ event, index, onSelectEvent, onEventDataUpdate, isOpen, openShareType, onToggleOrderbook }) => {
  const eventId = event.eventId || index + 1;
  const [mounted, setMounted] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(isOpen);
  const [orderbookData, setOrderbookData] = useState(null);

  const { connectionStatus, lastMessage } = useWebSocket(`${WS_BASE_URL}/ws/orderbook/${eventId}/`);
  const bestAsk = orderbookData?.asks?.length > 0 ? Math.min(...orderbookData.asks.map(a => a.price)) : null;
  const bestBid = orderbookData?.bids?.length > 0 ? Math.max(...orderbookData.bids.map(b => b.price)) : null;

  useEffect(() => {
    if (lastMessage?.type === 'orderbook_snapshot') setOrderbookData(lastMessage);
  }, [lastMessage]);

  // Handle CSS transition timing for expandable row
  useEffect(() => {
    let timer;
    if (isOpen) {
      setMounted(true);
      timer = setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
      timer = setTimeout(() => setMounted(false), 360);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (onEventDataUpdate && orderbookData) {
      onEventDataUpdate(eventId, { orderbookData, bestBid, bestAsk, connectionStatus });
    }
  }, [orderbookData, bestBid, bestAsk, connectionStatus, onEventDataUpdate, eventId]);

  return (
    <>
      <div className={`wallet-transactions-row ${index % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`} role="row" style={gridStyle}>

        <div className="wallet-table-col" role="cell">
          <div className="market-events__outcome-name">{event.outcomeName}</div>
          <div className="market-events__outcome-price">{bestAsk !== null ? `${(bestAsk * 100).toFixed(1)}c` : '-'}</div>
        </div>

        <div className="wallet-table-col" role="cell">
          <span className={bestAsk !== null ? 'live-chance' : 'static-chance'}>
            {bestAsk !== null ? `${(bestAsk * 100).toFixed(1)}%` : '-'}
          </span>
        </div>

        <div className="wallet-table-col" role="cell">
          <div className="market-events__actions-inner" style={{ display: 'flex', gap: '8px' }}>
            <Button height="short" fill="light" outline="none" width="full" onClick={() => onSelectEvent(event, 'yes')}>
              Yes
            </Button>
            <Button height="short" fill="light" outline="none" width="full" onClick={() => onSelectEvent(event, 'no')}>
              No
            </Button>
          </div>
        </div>

        <div className="wallet-table-col" role="cell">
          <div className="orderbook-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button
              height="short"
              fill="none"
              outline="light"
              textColor="dark"
              iconColor="primary"
              isSelectable={true}
              isSelected={isOpen && openShareType === 'YES'}
              selectedVariant="outline-primary"
              icon={<span className="iconify" data-icon="ri:arrow-down-s-line" />}
              iconPosition="right"
              onClick={() => onToggleOrderbook(eventId, 'YES')}
            >
              YES order book
            </Button>

            <Button
              height="short"
              fill="none"
              outline="light"
              textColor="dark"
              iconColor="primary"
              isSelectable={true}
              isSelected={isOpen && openShareType === 'NO'}
              selectedVariant="outline-primary"
              icon={<span className="iconify" data-icon="ri:arrow-down-s-line" />}
              iconPosition="right"
              onClick={() => onToggleOrderbook(eventId, 'NO')}
            >
              NO order book
            </Button>
          </div>
        </div>

      </div>

      {mounted && (
        <div className={`orderbook-inline-wrapper ${isAnimating ? 'open' : ''}`} style={{ gridColumn: '1 / -1', padding: '10px 0' }}>
          <OrderBook
            inline
            isOpen={true}
            onClose={() => onToggleOrderbook(null, null)}
            eventId={eventId}
            eventName={event.outcomeName}
            shareType={openShareType || 'YES'}
            orderbookData={orderbookData}
            connectionStatus={connectionStatus}
          />
        </div>
      )}
    </>
  );
};

EventRow.propTypes = {
  event: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onSelectEvent: PropTypes.func.isRequired,
  onEventDataUpdate: PropTypes.func,
  isOpen: PropTypes.bool.isRequired,
  openShareType: PropTypes.string,
  onToggleOrderbook: PropTypes.func.isRequired,
};

/**
 * Renders the table of events for a specific market.
 * @param {Object} props
 * @param {EventData[]} [props.events=[]]
 * @param {function(EventData, string): void} props.onSelectEvent
 * @param {function(number, Object): void} [props.onEventDataUpdate]
 * @returns {JSX.Element}
 */
export const MarketEventsTable = ({ events = [], onSelectEvent, onEventDataUpdate }) => {
  const [openOrderbook, setOpenOrderbook] = useState({ eventId: null, shareType: null });

  /**
   * @param {number|null} eventId
   * @param {string|null} shareType
   */
  const onToggleOrderbook = (eventId, shareType) => {
    setOpenOrderbook(prev =>
      prev.eventId === eventId && prev.shareType === shareType
        ? { eventId: null, shareType: null }
        : { eventId, shareType }
    );
  };

  return (
    <div className="wallet-transactions-table market-events-table" role="table">
      <div className="wallet-transactions-header" role="row" style={gridStyle}>
        <div className="wallet-table-col">Outcome</div>
        <div className="wallet-table-col">Chance</div>
        <div className="wallet-table-col">Yes / No</div>
        <div className="wallet-table-col">Order Book</div>
      </div>
      <div className="wallet-transactions-body" role="rowgroup">
        {events.map((ev, i) => (
          <EventRow
            key={`ev-row-${ev.eventId || i}`}
            event={ev}
            index={i}
            onSelectEvent={onSelectEvent}
            onEventDataUpdate={onEventDataUpdate}
            isOpen={openOrderbook.eventId === ev.eventId}
            openShareType={openOrderbook.shareType}
            onToggleOrderbook={onToggleOrderbook}
          />
        ))}
      </div>
    </div>
  );
};

MarketEventsTable.propTypes = {
  events: PropTypes.array,
  onSelectEvent: PropTypes.func.isRequired,
  onEventDataUpdate: PropTypes.func,
};