import React, { useState } from 'react';
import OrderBook from './orderBook';
import './orderbook.css';

const OrderBookDropdown = ({ eventId, eventName, shareType = 'YES', className = "", orderbookData, connectionStatus, lastUpdated }) => {
  const [isOrderBookOpen, setIsOrderBookOpen] = useState(false);

  const handleOpenOrderBook = () => {
    setIsOrderBookOpen(true);
  };

  const handleCloseOrderBook = () => {
    setIsOrderBookOpen(false);
  };

  return (
    <>
      <button
        className={`orderbook-dropdown-button ${className}`}
        onClick={handleOpenOrderBook}
        title={`View ${shareType} Order Book`}
      >
        <span className="orderbook-dropdown-icon">
          <span className="iconify" data-icon="mdi:chart-line" data-inline="false"></span>
        </span>
        <span className="orderbook-dropdown-text">{shareType} Order Book</span>
        <span className="orderbook-dropdown-arrow">
          <span className="iconify" data-icon="mdi:chevron-down" data-inline="false"></span>
        </span>
      </button>

      <OrderBook
        eventId={eventId}
        eventName={eventName}
        shareType={shareType}
        isOpen={isOrderBookOpen}
        onClose={handleCloseOrderBook}
        orderbookData={orderbookData}
        connectionStatus={connectionStatus}
        lastUpdated={lastUpdated}
      />
    </>
  );
};

export default OrderBookDropdown;
