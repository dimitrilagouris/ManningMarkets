import React, { useState, useEffect } from 'react';
import './OrderBook.css';

const OrderBook = ({
  eventId,
  eventName,
  shareType = 'YES',
  isOpen,
  onClose,
  orderbookData,
  connectionStatus,
  lastUpdated,
  inline = false // new prop: when true render inline under the row
}) => {
  const [processedOrderbookData, setProcessedOrderbookData] = useState({
    bids: [],
    asks: [],
    timestamp: null
  });

  useEffect(() => {
    if (orderbookData && orderbookData.bids && orderbookData.asks) {
      let processedData = {
        bids: orderbookData.bids || [],
        asks: orderbookData.asks || [],
        timestamp: orderbookData.timestamp
      };

      if (shareType === 'NO') {
        const transformedBids = (orderbookData.asks || []).map(order => ({
          ...order,
          price: 1.0 - order.price
        }));

        const transformedAsks = (orderbookData.bids || []).map(order => ({
          ...order,
          price: 1.0 - order.price
        }));

        processedData = {
          bids: transformedBids,
          asks: transformedAsks,
          timestamp: orderbookData.timestamp
        };
      }

      setProcessedOrderbookData(processedData);
    }
  }, [orderbookData, shareType]);

  const formatPrice = (price) => `${(price * 100).toFixed(1)}%`;

  const formatQuantity = (quantity) => {
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(1)}k`;
    return quantity?.toString() ?? '0';
  };

  const calculateCumulativeTotals = (orders, isAsks = false) => {
    if (isAsks) {
      let cumulative = 0;
      const reversedOrders = [...orders].reverse();
      const withCumulative = reversedOrders.map(order => {
        cumulative += order.quantity;
        return { ...order, cumulative };
      });
      return withCumulative.reverse();
    } else {
      let cumulative = 0;
      return orders.map(order => {
        cumulative += order.quantity;
        return { ...order, cumulative };
      });
    }
  };

  const getMaxCumulative = (bids, asks) => {
    const maxBid = bids.length > 0 ? Math.max(...bids.map(b => b.cumulative)) : 0;
    const maxAsk = asks.length > 0 ? Math.max(...asks.map(a => a.cumulative)) : 0;
    return Math.max(maxBid, maxAsk);
  };

  // sort highest-to-lowest price for top-to-bottom display
  const sortedAsks = [...processedOrderbookData.asks].sort((a, b) => b.price - a.price);
  const sortedBids = [...processedOrderbookData.bids].sort((a, b) => b.price - a.price);

  const bidsWithTotals = calculateCumulativeTotals(sortedBids, false);
  const asksWithTotals = calculateCumulativeTotals(sortedAsks, true);
  const maxCumulative = getMaxCumulative(bidsWithTotals, asksWithTotals);

  const calculateSpread = () => {
    if (bidsWithTotals.length === 0 || asksWithTotals.length === 0) return null;
    const bestBid = bidsWithTotals[0]?.price || 0;
    const bestAsk = asksWithTotals[asksWithTotals.length - 1]?.price || 0;
    const spread = bestAsk - bestBid;
    if (spread <= 0) return null;
    return { spread, bestBid, bestAsk };
  };

  const spreadData = calculateSpread();

  // Modal behaviour unchanged: if not inline and not open, unmount (return null)
  if (!inline && !isOpen) return null;

  // For inline mode we always render the wrapper so the CSS animation can run on opening and closing.
  // The wrapper gets the 'open' class when isOpen is true.
  if (inline) {
    return (
      <div className={`orderbook-inline-wrapper ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
        <div className="orderbook-container orderbook-container--inline" onClick={(e) => e.stopPropagation()}>
          <div className="orderbook-header orderbook-header--inline">
            <div className="orderbook-title">
              <h2>{shareType} Order Book</h2>
              <div className="orderbook-subtitle">{eventName}</div>
            </div>

            <div className="orderbook-status">
              <div className={`status-indicator ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                <span className="status-dot"></span>
                <span className="status-text">{connectionStatus === 'connected' ? 'connected' : connectionStatus}</span>
              </div>
              {lastUpdated && <div className="last-updated">Last updated: {lastUpdated}</div>}
              <div className="orderbook-summary">
                Bids: <strong>{processedOrderbookData.bids.length}</strong> Asks: <strong>{processedOrderbookData.asks.length}</strong>
              </div>
            </div>

            <button className="orderbook-close" onClick={onClose} aria-label="Close orderbook">
              <span className="iconify" data-icon="mdi:close" data-inline="false"></span>
            </button>
          </div>

          <div className="orderbook-content">
            <div className="orderbook-table">
              <div className="orderbook-columns">
                <div className="orderbook-column">PRICE</div>
                <div className="orderbook-column">QUANTITY</div>
                <div className="orderbook-column">TOTAL</div>
              </div>

              <div className="orderbook-section asks-section">
                {asksWithTotals.map((ask, index) => {
                  const barWidth = maxCumulative > 0 ? (ask.cumulative / maxCumulative) * 100 : 0;
                  return (
                    <div key={`ask-${index}`} className="orderbook-row ask-row">
                      <div className="orderbook-bar ask-bar" style={{ width: `${barWidth}%` }}></div>
                      <div className="orderbook-cell price-cell">{formatPrice(ask.price)}</div>
                      <div className="orderbook-cell quantity-cell">{formatQuantity(ask.quantity)}</div>
                      <div className="orderbook-cell total-cell">{formatQuantity(ask.cumulative)}</div>
                    </div>
                  );
                })}
              </div>

              {spreadData && (
                <div className="orderbook-divider">
                  <span className="orderbook-divider-text">Spread: {formatPrice(spreadData.spread)}</span>
                </div>
              )}

              <div className="orderbook-section bids-section">
                {bidsWithTotals.map((bid, index) => {
                  const barWidth = maxCumulative > 0 ? (bid.cumulative / maxCumulative) * 100 : 0;
                  return (
                    <div key={`bid-${index}`} className="orderbook-row bid-row">
                      <div className="orderbook-bar bid-bar" style={{ width: `${barWidth}%` }}></div>
                      <div className="orderbook-cell price-cell">{formatPrice(bid.price)}</div>
                      <div className="orderbook-cell quantity-cell">{formatQuantity(bid.quantity)}</div>
                      <div className="orderbook-cell total-cell">{formatQuantity(bid.cumulative)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-inline modal overlay behaviour (unchanged)
  return (
    <div className="orderbook-overlay" onClick={onClose}>
      <div className="orderbook-container" onClick={(e) => e.stopPropagation()}>
        <div className="orderbook-header">
          <div className="orderbook-title">
            <h2>{shareType} Order Book</h2>
            <div className="orderbook-subtitle">{eventName}</div>
          </div>
          <div className="orderbook-status">
            <div className={`status-indicator ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              <span className="status-text">{connectionStatus === 'connected' ? 'connected' : connectionStatus}</span>
            </div>
            {lastUpdated && <div className="last-updated">Last updated: {lastUpdated}</div>}
            <div className="orderbook-summary">
              Bids: <strong>{processedOrderbookData.bids.length}</strong> Asks: <strong>{processedOrderbookData.asks.length}</strong>
            </div>
          </div>

          <button className="orderbook-close" onClick={onClose} aria-label="Close orderbook">
            <span className="iconify" data-icon="mdi:close" data-inline="false"></span>
          </button>
        </div>

        <div className="orderbook-content">
          <div className="orderbook-table">
            <div className="orderbook-columns">
              <div className="orderbook-column">PRICE</div>
              <div className="orderbook-column">QUANTITY</div>
              <div className="orderbook-column">TOTAL</div>
            </div>

            <div className="orderbook-section asks-section">
              {asksWithTotals.map((ask, index) => {
                const barWidth = maxCumulative > 0 ? (ask.cumulative / maxCumulative) * 100 : 0;
                return (
                  <div key={`ask-${index}`} className="orderbook-row ask-row">
                    <div className="orderbook-bar ask-bar" style={{ width: `${barWidth}%` }}></div>
                    <div className="orderbook-cell price-cell">{formatPrice(ask.price)}</div>
                    <div className="orderbook-cell quantity-cell">{formatQuantity(ask.quantity)}</div>
                    <div className="orderbook-cell total-cell">{formatQuantity(ask.cumulative)}</div>
                  </div>
                );
              })}
            </div>

            {spreadData && (
              <div className="orderbook-divider">
                <span className="orderbook-divider-text">Spread: {formatPrice(spreadData.spread)}</span>
              </div>
            )}

            <div className="orderbook-section bids-section">
              {bidsWithTotals.map((bid, index) => {
                const barWidth = maxCumulative > 0 ? (bid.cumulative / maxCumulative) * 100 : 0;
                return (
                  <div key={`bid-${index}`} className="orderbook-row bid-row">
                    <div className="orderbook-bar bid-bar" style={{ width: `${barWidth}%` }}></div>
                    <div className="orderbook-cell price-cell">{formatPrice(bid.price)}</div>
                    <div className="orderbook-cell quantity-cell">{formatQuantity(bid.quantity)}</div>
                    <div className="orderbook-cell total-cell">{formatQuantity(bid.cumulative)}</div>
                  </div>
                );
             })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
