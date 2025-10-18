import React, { useState, useEffect } from 'react';
import './orderbook.css';

const OrderBook = ({ eventId, eventName, shareType = 'YES', isOpen, onClose, orderbookData, connectionStatus, lastUpdated }) => {
  const [processedOrderbookData, setProcessedOrderbookData] = useState({
    bids: [],
    asks: [],
    timestamp: null
  });

  // Process orderbook data when it changes
  useEffect(() => {
    if (orderbookData && orderbookData.bids && orderbookData.asks) {
      let processedData = {
        bids: orderbookData.bids || [],
        asks: orderbookData.asks || [],
        timestamp: orderbookData.timestamp
      };

      // If viewing NO shares, flip the prices (1 - price) and swap bids/asks
      if (shareType === 'NO') {
        // Transform prices: P_NO = 1 - P_YES
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

  // Format price for display (convert decimal to percentage)
  const formatPrice = (price) => {
    return `${(price * 100).toFixed(1)}%`;
  };

  // Format quantity for display
  const formatQuantity = (quantity) => {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(1)}k`;
    }
    return quantity.toString();
  };

  // Calculate cumulative totals for visual bars
  const calculateCumulativeTotals = (orders, isAsks = false) => {
    if (isAsks) {
      // For asks: we want cumulative totals from the lowest ask (best ask) up to each level
      // Since we sorted asks in descending order (highest first), we need to calculate backwards
      let cumulative = 0;
      const reversedOrders = [...orders].reverse(); // Reverse to start from lowest ask
      
      const withCumulative = reversedOrders.map(order => {
        cumulative += order.quantity;
        return {
          ...order,
          cumulative
        };
      });
      
      return withCumulative.reverse(); // Reverse back to original order (highest first)
    } else {
      // For bids: cumulative should increase as we go down (from highest bid to lowest bid)
      let cumulative = 0;
      return orders.map(order => {
        cumulative += order.quantity;
        return {
          ...order,
          cumulative
        };
      });
    }
  };

  // Get max cumulative for bar scaling
  const getMaxCumulative = (bids, asks) => {
    const maxBid = bids.length > 0 ? Math.max(...bids.map(b => b.cumulative)) : 0;
    const maxAsk = asks.length > 0 ? Math.max(...asks.map(a => a.cumulative)) : 0;
    return Math.max(maxBid, maxAsk);
  };

  // Sort orders for proper top-to-bottom display (highest to lowest price)
  const sortedAsks = [...processedOrderbookData.asks].sort((a, b) => b.price - a.price); // Highest ask first
  const sortedBids = [...processedOrderbookData.bids].sort((a, b) => b.price - a.price); // Highest bid first
  
  const bidsWithTotals = calculateCumulativeTotals(sortedBids, false);
  const asksWithTotals = calculateCumulativeTotals(sortedAsks, true);
  const maxCumulative = getMaxCumulative(bidsWithTotals, asksWithTotals);

  // Calculate bid-ask spread
  const calculateSpread = () => {
    if (bidsWithTotals.length === 0 || asksWithTotals.length === 0) {
      return null;
    }
    
    const bestBid = bidsWithTotals[0]?.price || 0; // Highest bid (first in sorted list)
    const bestAsk = asksWithTotals[asksWithTotals.length - 1]?.price || 0; // Lowest ask (last in sorted list)
    const spread = bestAsk - bestBid;
    
    if (spread <= 0) return null;
    
    return {
      spread: spread,
      bestBid: bestBid,
      bestAsk: bestAsk,
    };
  };

  const spreadData = calculateSpread();

  if (!isOpen) return null;

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
                <span className="status-text">
                  {connectionStatus === 'connected' ? 'connected' : connectionStatus}
                </span>
              </div>
              {lastUpdated && (
                <div className="last-updated">
                  Last updated: {lastUpdated}
                </div>
              )}
              <div className="orderbook-summary">
                Bids: <strong>{processedOrderbookData.bids.length}</strong> Asks: <strong>{processedOrderbookData.asks.length}</strong>
              </div>
            </div>
          <button className="orderbook-close" onClick={onClose}>
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

            {/* Asks (Sell Orders) - Red */}
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

            {/* Bid-Ask Spread Divider */}
            {spreadData && (
              <div className="orderbook-divider">
                <span className="orderbook-divider-text">
                  Spread: {formatPrice(spreadData.spread)}
                </span>
              </div>
            )}

            {/* Bids (Buy Orders) - Green */}
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