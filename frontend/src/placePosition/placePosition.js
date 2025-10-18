// placePosition.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DJANGO_API_BASE } from '../config';
import OrderBookDropdown from '../orderbook/OrderBookDropdown';
import { useWebSocket } from '../websocketHook/useWebsocket';
import { AuthContext } from '../session_management/authentication_context';
import Cookies from 'js-cookie';
import './placePosition.css';
import '../base.css';

// Custom hook to manage live orderbook data for a single event
const useEventOrderbookData = (eventId) => {
  const [orderbookData, setOrderbookData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const wsUrl = `ws://localhost:8000/ws/orderbook/${eventId}/`;
  const { connectionStatus, lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'orderbook_snapshot') {
      setOrderbookData(lastMessage);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [lastMessage]);

  return {
    orderbookData,
    connectionStatus,
    lastUpdated,
    bestAsk: orderbookData?.asks && orderbookData.asks.length > 0 
      ? Math.min(...orderbookData.asks.map(ask => ask.price))
      : null
  };
};

// Component for individual event row with its own WebSocket connection
const EventRow = ({ event, index, onSelectEvent, onEventDataUpdate }) => {
  const eventId = event.eventId || index + 1;
  const { orderbookData, connectionStatus, lastUpdated, bestAsk } = useEventOrderbookData(eventId);
  
  const hasLiveData = bestAsk !== null && bestAsk !== undefined;
  const liveChance = hasLiveData ? `${(bestAsk * 100).toFixed(1)}%` : '-';

  // Calculate best bid and best ask from orderbook data
  const bestBid = orderbookData?.bids && orderbookData.bids.length > 0 
    ? Math.max(...orderbookData.bids.map(bid => bid.price))
    : null;
  const bestAskPrice = orderbookData?.asks && orderbookData.asks.length > 0 
    ? Math.min(...orderbookData.asks.map(ask => ask.price))
    : null;

  // Notify parent component when orderbook data changes
  useEffect(() => {
    if (onEventDataUpdate && orderbookData) {
      onEventDataUpdate(eventId, {
        orderbookData,
        bestBid,
        bestAsk: bestAskPrice,
        connectionStatus,
        lastUpdated
      });
    }
  }, [orderbookData, bestBid, bestAskPrice, connectionStatus, lastUpdated, eventId, onEventDataUpdate]);

  return (
    <tr className="market-events__tr" key={index}>
      <td className="market-events__td market-events__outcome">
        <div className="market-events__outcome-name">{event.outcomeName}</div>
        <div className="market-events__outcome-price">
          {hasLiveData ? `${(bestAsk * 100).toFixed(1)}c` : '-'}
        </div>
      </td>

      <td className="market-events__td market-events__chance">
        <span className={hasLiveData ? 'live-chance' : 'static-chance'}>
          {liveChance}
        </span>
        {hasLiveData && (
          <span className="live-indicator" title={`Live data - Updated: ${lastUpdated}`}>
            ●
          </span>
        )}
      </td>

      <td className="market-events__td market-events__actions">
        <button
          type="button"
          className="place-position__choice-button place-position__choice-button--yes market-events__btn"
          onClick={() => onSelectEvent(event, 'yes')}
        >
          Yes
        </button>
        <button
          type="button"
          className="place-position__choice-button place-position__choice-button--no market-events__btn"
          onClick={() => onSelectEvent(event, 'no')}
        >
          No
        </button>
      </td>

      <td className="market-events__td market-events__orderbook">
        <div className="orderbook-buttons">
          <OrderBookDropdown
            eventId={eventId}
            eventName={event.outcomeName}
            shareType="YES"
            className="market-events__btn orderbook-btn-yes"
            orderbookData={orderbookData}
            connectionStatus={connectionStatus}
            lastUpdated={lastUpdated}
          />
          <OrderBookDropdown
            eventId={eventId}
            eventName={event.outcomeName}
            shareType="NO"
            className="market-events__btn orderbook-btn-no"
            orderbookData={orderbookData}
            connectionStatus={connectionStatus}
            lastUpdated={lastUpdated}
          />
        </div>
      </td>
    </tr>
  );
};

export const MarketEventsTable = ({ events = [], onSelectEvent, marketId, onEventDataUpdate }) => {

  return (
    <div className="market-events">
      <table className="market-events__table" role="table">
        <thead>
          <tr>
            <th className="market-events__th">Outcome</th>
            <th className="market-events__th">Chance</th>
            <th className="market-events__th">Yes / No</th>
            <th className="market-events__th">Order Book</th>
          </tr>
        </thead>

        <tbody>
          {events.map((ev, i) => (
            <EventRow
              key={i}
              event={ev}
              index={i}
              onSelectEvent={onSelectEvent}
              onEventDataUpdate={onEventDataUpdate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const PlacePositionPage = () => {
  const { marketId } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null); // 'yes' or 'no'
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventOrderbookData, setEventOrderbookData] = useState({}); // Store live orderbook data by eventId
  
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${DJANGO_API_BASE}/fetch_market/${marketId}/`, {
          headers: {'X-Requested-With': 'XMLHttpRequest'}
        });

        if (!res.ok) {
          throw new Error('Failed to fetch market');
        }

        const data = await res.json();
        setMarket(data.market);
        
        // Auto-select the first event if available
        if (data.market.events && data.market.events.length > 0) {
          const firstEvent = data.market.events[0];
          setSelectedEvent({
            outcomeName: firstEvent.name,
            price: `${firstEvent.price}c`,
            chance: `${firstEvent.price}%`,
            volume: firstEvent.volume,
            eventId: firstEvent.id // Include the eventId for orderbook data lookup
          });
        }
      } catch (err) {
        console.error("Fetching Market Error: ", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchWalletBalance = async () => {
      if (!isAuthenticated) {
        setWalletBalance(0);
        return;
      }

      try {
        const res = await fetch(`${DJANGO_API_BASE}/wallet/`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'X-CSRFToken': Cookies.get('csrftoken'),
          }
        });

        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.balance || 0);
        } else {
          console.error('Failed to fetch wallet balance');
          setWalletBalance(0);
        }
      } catch (err) {
        console.error("Fetching Wallet Error: ", err);
        setWalletBalance(0);
      }
    };

    if (marketId) {
      fetchMarket();
    }
    fetchWalletBalance();
  }, [marketId, isAuthenticated]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleSharesChange = (e) => {
    const value = e.target.value;
    // Only allow integers
    if (value === '' || /^\d*$/.test(value)) {
      setShares(value);
    }
  };

  const handleIncrease = () => {
    const num = amount ? parseFloat(amount) : 0;
    setAmount((num + 1).toFixed(2));
  };

  const handleDecrease = () => {
    const num = amount ? parseFloat(amount) : 0;
    setAmount(Math.max(0, num - 1).toFixed(2));
  };

  const toggleTradeType = () => {
    setTradeType(prev => prev === 'buy' ? 'sell' : 'buy');
  };

  const handleSelectEvent = useCallback((event, choice) => {
    setSelectedEvent(event);
    setSelectedChoice(choice);
  }, []);

  const handleChoiceButtonClick = useCallback((choice) => {
    setSelectedChoice(choice);
  }, []);

  // Helper function to determine if a message is an error
  const isErrorMessage = (message) => {
    const errorKeywords = [
      'Error',
      'error',
      'Failed',
      'failed',
      'Invalid',
      'invalid',
      'Insufficient',
      'insufficient',
      'Please',
      'please',
      'required',
      'Required'
    ];
    return errorKeywords.some(keyword => message.includes(keyword));
  };

  const handleSubmitOrder = async () => {
    // Validate authentication
    if (!isAuthenticated || !user) {
      setOrderMessage('Please log in to place orders');
      return;
    }

    // Validate required fields
    if (!selectedEvent || !selectedChoice || !amount || !shares) {
      setOrderMessage('Please fill in all required fields');
      return;
    }

    if (!selectedEvent.eventId) {
      setOrderMessage('No event selected');
      return;
    }

    // Convert amount from dollars to decimal price (e.g., $0.25 -> 0.25)
    const price = parseFloat(amount);
    const quantity = parseInt(shares, 10);

    // Calculate total cost for buy orders
    if (tradeType === 'buy') {
      const totalCost = price * quantity;
      if (totalCost > walletBalance) {
        setOrderMessage(`Insufficient balance. Order cost: $${totalCost.toFixed(2)}, Available: $${walletBalance.toFixed(2)}`);
        return;
      }
    }

    setSubmittingOrder(true);
    setOrderMessage('');

    try {

      const orderData = {
        event_id: selectedEvent.eventId,
        order_type: tradeType.toUpperCase(),
        share_type: selectedChoice.toUpperCase(),
        quantity: quantity,
        price: price
      };

      const response = await fetch(`${DJANGO_API_BASE}/api/orders/`, {
        method: 'POST',
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken'),
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit order');
      }

      const result = await response.json();
      console.log('Order submitted successfully:', result);
      
      setOrderMessage(`Order submitted successfully! ${result.trades_executed} trades executed.`);
      
      // Clear form
      setAmount('');
      setShares('');
      
      // Refresh wallet balance after successful order
      const refreshWalletBalance = async () => {
        try {
          const res = await fetch(`${DJANGO_API_BASE}/wallet/`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-CSRFToken': Cookies.get('csrftoken'),
            }
          });

          if (res.ok) {
            const data = await res.json();
            setWalletBalance(data.balance || 0);
          }
        } catch (err) {
          console.error("Error refreshing wallet balance: ", err);
        }
      };
      refreshWalletBalance();
      
    } catch (err) {
      console.error('Order submission error:', err);
      setOrderMessage(`Error: ${err.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Handle orderbook data updates from EventRow components
  const handleEventDataUpdate = useCallback((eventId, orderbookData) => {
    setEventOrderbookData(prev => ({
      ...prev,
      [eventId]: orderbookData
    }));
  }, []);

  // Calculate yes and no prices from live orderbook data
  const getYesNoPrice = () => {
    if (!selectedEvent) {
      return { yesPrice: '50c', noPrice: '50c' };
    }

    // Try to get live orderbook data first
    if (selectedEvent.eventId) {
      const orderbookData = eventOrderbookData[selectedEvent.eventId];
      if (orderbookData && orderbookData.bestBid && orderbookData.bestAsk) {
        let yesPrice, noPrice;

        if (tradeType === 'buy') {
          // When buying: YES price = best ask for YES, NO price = best ask for NO (1 - best bid for YES)
          yesPrice = orderbookData.bestAsk;
          noPrice = 1 - orderbookData.bestBid;
        } else {
          // When selling: YES price = best bid for YES, NO price = best bid for NO (1 - best ask for YES)
          yesPrice = orderbookData.bestBid;
          noPrice = 1 - orderbookData.bestAsk;
        }

        return {
          yesPrice: `${(yesPrice * 100).toFixed(1)}c`,
          noPrice: `${(noPrice * 100).toFixed(1)}c`
        };
      }
    }

    // Fallback to static price from event data if live data not available
    if (selectedEvent.price) {
      const priceMatch = selectedEvent.price.match(/(\d+)/);
      if (priceMatch) {
        const yesCents = parseInt(priceMatch[1], 10);
        const noCents = 100 - yesCents;
        return {
          yesPrice: `${yesCents}c`,
          noPrice: `${noCents}c`
        };
      }
    }

    // Final fallback
    return { yesPrice: '50c', noPrice: '50c' };
  };

  const { yesPrice, noPrice } = getYesNoPrice();

  if (loading) {
    return <div className="place-position">Loading market data...</div>;
  }

  if (error) {
    return <div className="place-position">Error loading market: {error.message}</div>;
  }

  if (!market) {
    return <div className="place-position">Market not found</div>;
  }

  // Transform events data to match the expected format
  const events = market.events.map(event => ({
    outcomeName: event.name,
    price: `${Number(event.price).toFixed(2)}c`,
    chance: `${Number(event.price).toFixed(2)}%`,
    volume: event.volume,
    eventId: event.id // Include the event ID for orderbook
  }));

  return (
    <div className="place-position">
      <div className="place-position__left">
        <div className="place-position__left-content">
          <div className="place-position__title place-position__title--market">{market.name}</div>
          <div className="place-position__subtitle">Volume: ${market.market_volume.toLocaleString()}</div>
          <div className="place-position__timestamp">October 14, 2025</div>

          {/* Market events table component — pass events here */}
          <MarketEventsTable events={events} onSelectEvent={handleSelectEvent} marketId={marketId} onEventDataUpdate={handleEventDataUpdate} />
        </div>
      </div>

      <div className="place-position__right">
        <div className="place-position__right-header">
          <div className="place-position__title place-position__title--position">
            {selectedEvent ? selectedEvent.outcomeName : 'Position Name Goes Here'}
          </div>

          <button className="place-position__button--buy-sell" onClick={toggleTradeType}>
            <span className="place-position__subtitle">
              {tradeType === 'buy' ? 'Buy' : 'Sell'}
            </span>
            <div className="place-position__icon">
              <span className="iconify" data-icon="mdi:chevron-down" data-inline="false"></span>
            </div>
          </button>
        </div>

        <div className="place-position__info-container">
          <div className="place-position__outcome">
            <div className="place-position__subtitle">Outcome</div>
            <div className="place-position__icon">
              <span className="iconify" data-icon="ri:information-2-line" data-inline="false"></span>
            </div>
          </div>

          <div className="place-position__choice-buttons">
            <button
              className={`place-position__choice-button place-position__choice-button--yes ${selectedChoice === 'yes' ? 'place-position__choice-button--selected' : ''}`}
              onClick={() => handleChoiceButtonClick('yes')}
            >
              Yes {yesPrice}
            </button>

            <button
              className={`place-position__choice-button place-position__choice-button--no ${selectedChoice === 'no' ? 'place-position__choice-button--selected' : ''}`}
              onClick={() => handleChoiceButtonClick('no')}
            >
              No {noPrice}
            </button>
          </div>

          <div className="place-position__amount">
            <div className="place-position__subtitle">Amount</div>

            <div className="place-position__balance">
              <div className="place-position__balance-text">Balance ${walletBalance.toFixed(2)}</div>
            </div>
          </div>

          {/* New form rows: Limit Price and Shares - labels on left, inputs on right */}
          <div className="place-position__form-row">
            <div className="place-position__form-label">Limit Price</div>

            <div className="place-position__input place-position__input--compact" aria-label="Limit price input">
              <button
                className="place-position__input-button"
                aria-label="Decrease amount"
                onClick={handleDecrease}
              >
                <span className="iconify" data-icon="ri:subtract-line" data-inline="false"></span>
              </button>

              <label className="place-position__input-field" aria-hidden="false">
                <div className="place-position__input-center">
                  <span className="place-position__currency">$</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={handleInputChange}
                    aria-label="Enter limit price"
                  />
                </div>
              </label>

              <button
                className="place-position__input-button"
                aria-label="Increase amount"
                onClick={handleIncrease}
              >
                <span className="iconify" data-icon="ri:add-large-fill" data-inline="false"></span>
              </button>
            </div>
          </div>

          <div className="place-position__form-row">
            <div className="place-position__form-label">Shares</div>

            <div className="place-position__simple-input" aria-label="Shares input">
              <input
                type="text"
                placeholder="0"
                value={shares}
                onChange={handleSharesChange}
                aria-label="Enter number of shares"
              />
            </div>
          </div>

          <button 
            className="place-position__button--buy"
            onClick={handleSubmitOrder}
            disabled={submittingOrder}
          >
            {submittingOrder ? 'Submitting...' : (tradeType === 'buy' ? 'Buy' : 'Sell')}
          </button>

          {orderMessage && (
            <div className={`order-message ${isErrorMessage(orderMessage) ? 'error' : 'success'}`}>
              {orderMessage}
            </div>
          )}

          <div className="place-position__stat-row place-position__stat-row--shares">
            <div className="place-position__stat-label">Shares</div>
            <div className="place-position__stat-label">{shares || 0}</div>
          </div>

          <div className="place-position__stat-row place-position__stat-row--return">
            <div className="place-position__stat-label">Potential Return</div>
            <div className="place-position__stat-value place-position__stat-value--positive">
              {(() => {
                if (!shares || !amount) return '$0.00';
                const sharesNum = parseInt(shares, 10);
                const pricePaid = parseFloat(amount);
                const potentialReturn = sharesNum * (1 - pricePaid);
                return `$${potentialReturn.toFixed(2)}`;
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

