// placePosition.jsx
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { DJANGO_API_BASE } from '../config';
import OrderBook from '../orderbook/orderBook';
import { useWebSocket } from '../websocketHook/useWebsocket';
import { AuthContext } from '../session_management/authentication_context';
import Cookies from 'js-cookie';
import './placePosition.css';
import '../base.css';

/* ---------- custom hook: live orderbook for one event ---------- */
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
    bestAsk:
      orderbookData?.asks && orderbookData.asks.length > 0
        ? Math.min(...orderbookData.asks.map(a => a.price))
        : null
  };
};

/* ---------- EventRow component (single event row + inline orderbook) ---------- */
const EventRow = ({
  event,
  index,
  onSelectEvent,
  onEventDataUpdate,
  isOpen,
  openShareType,
  onToggleOrderbook
}) => {
  const eventId = event.eventId || index + 1;
  const { orderbookData, connectionStatus, lastUpdated, bestAsk } = useEventOrderbookData(eventId);

  const hasLiveData = bestAsk !== null && bestAsk !== undefined;
  const liveChance = hasLiveData ? `${(bestAsk * 100).toFixed(1)}%` : '-';

  const bestBid =
    orderbookData?.bids && orderbookData.bids.length > 0
      ? Math.max(...orderbookData.bids.map(b => b.price))
      : null;
  const bestAskPrice =
    orderbookData?.asks && orderbookData.asks.length > 0
      ? Math.min(...orderbookData.asks.map(a => a.price))
      : null;

  // notify parent when orderbook snapshot updates for this event
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderbookData, bestBid, bestAskPrice, connectionStatus, lastUpdated]);

  const handleToggle = (shareType) => onToggleOrderbook(eventId, shareType);

  // Inline orderbook mount/unmount helper so CSS height transition can run
  const ANIMATION_MS = 360;
  const [mounted, setMounted] = useState(isOpen);
  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setMounted(true); // mount immediately so content is available for the open animation
    } else {
      // keep mounted for the duration of the animation, then unmount
      timeoutId = setTimeout(() => setMounted(false), ANIMATION_MS);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen]);

  return (
    <>
      <tr className="market-events__tr" key={`ev-${eventId}`}>
        <td className="market-events__td market-events__outcome">
          <div className="market-events__outcome-name">{event.outcomeName}</div>
          <div className="market-events__outcome-price">
            {hasLiveData ? `${(bestAsk * 100).toFixed(1)}c` : '-'}
          </div>
        </td>

        <td className="market-events__td market-events__chance">
          <span className={hasLiveData ? 'live-chance' : 'static-chance'}>{liveChance}</span>
          {hasLiveData && (
            <span className="live-indicator" title={`Live data - Updated: ${lastUpdated}`}>
              ●
            </span>
          )}
        </td>

        <td className="market-events__td market-events__actions">
          <div className="market-events__actions-inner">
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
          </div>
        </td>

        <td className="market-events__td market-events__orderbook">
          <div className="orderbook-buttons">
            <button
              type="button"
              className={`market-events__btn orderbook-btn orderbook-btn-yes ${isOpen && openShareType === 'YES' ? 'active' : ''}`}
              onClick={() => handleToggle('YES')}
              aria-expanded={isOpen && openShareType === 'YES'}
              aria-controls={`orderbook-${eventId}`}
            >
              YES order book
              <span className="iconify" data-icon="ri:arrow-down-s-line" data-inline="false" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={`market-events__btn orderbook-btn orderbook-btn-no ${isOpen && openShareType === 'NO' ? 'active' : ''}`}
              onClick={() => handleToggle('NO')}
              aria-expanded={isOpen && openShareType === 'NO'}
              aria-controls={`orderbook-${eventId}`}
            >
              NO order book
              <span className="iconify" data-icon="ri:arrow-down-s-line" data-inline="false" aria-hidden="true" />
            </button>
          </div>
        </td>
      </tr>

      {/* Inline orderbook row. wrapper remains in DOM so CSS can animate height */}
      <tr className="market-events__orderbook-row" key={`orderbook-${eventId}`}>
        <td colSpan="4" className="market-events__orderbook-cell">
          <div
            id={`orderbook-${eventId}`}
            className={`orderbook-inline-wrapper ${isOpen ? 'open' : ''}`}
            aria-hidden={!isOpen}
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            {mounted && (
              <OrderBook
                inline
                isOpen={true}
                onClose={() => onToggleOrderbook(null, null)}
                eventId={eventId}
                eventName={event.outcomeName}
                shareType={openShareType || 'YES'}
                orderbookData={orderbookData}
                connectionStatus={connectionStatus}
                lastUpdated={lastUpdated}
              />
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

/* ---------- MarketEventsTable (renders the rows) ---------- */
export const MarketEventsTable = ({ events = [], onSelectEvent, marketId, onEventDataUpdate }) => {
  const [openOrderbook, setOpenOrderbook] = useState({ eventId: null, shareType: null });

  const onToggleOrderbook = (eventId, shareType) => {
    setOpenOrderbook(prev => {
      if (prev.eventId === eventId && prev.shareType === shareType) {
        return { eventId: null, shareType: null };
      }
      if (eventId === null && shareType === null) {
        return { eventId: null, shareType: null };
      }
      return { eventId, shareType };
    });
  };

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
        </tbody>
      </table>
    </div>
  );
};

/* ---------- PlacePositionPage (main page) ---------- */
export const PlacePositionPage = () => {
  const { marketId } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState('yes'); // yes/no for form
  const [tradeDropdownOpen, setTradeDropdownOpen] = useState(false);

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventOrderbookData, setEventOrderbookData] = useState({});

  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  // fetch market + wallet
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${DJANGO_API_BASE}/fetch_market/${marketId}/`, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Market not found or has been closed');
          }
          throw new Error(`Failed to fetch market (${res.status})`);
        }
        
        const data = await res.json();
        setMarket(data.market);

        if (data.market.events && data.market.events.length > 0) {
          const firstEvent = data.market.events[0];
          setSelectedEvent({
            outcomeName: firstEvent.name,
            price: `${firstEvent.price}c`,
            chance: `${firstEvent.price}%`,
            volume: firstEvent.volume,
            eventId: firstEvent.id
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
          headers: { 'X-CSRFToken': Cookies.get('csrftoken') }
        });
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.balance || 0);
        }
      } catch (err) {
        console.error("Fetching Wallet Error: ", err);
        setWalletBalance(0);
      }
    };

    if (marketId) fetchMarket();
    fetchWalletBalance();
  }, [marketId, isAuthenticated]);

  // input handlers
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) setAmount(value);
  };

  const handleSharesChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) setShares(value);
  };

  const handleIncrease = () => {
    const num = amount ? parseFloat(amount) : 0;
    setAmount((num + 0.01).toFixed(2));
  };

  const handleDecrease = () => {
    const num = amount ? parseFloat(amount) : 0;
    setAmount(Math.max(0, num - 0.01).toFixed(2));
  };

  // trade dropdown handlers (now selects Buy / Sell)
  const toggleTradeDropdown = () => setTradeDropdownOpen(prev => !prev);
  const selectTradeType = (type) => {
    setTradeType(type);
    setTradeDropdownOpen(false);
  };

  // sync selection from table event controls
  const handleSelectEvent = useCallback((event, choice) => {
    setSelectedEvent(event);
    setSelectedChoice(choice);
  }, []);

  const handleEventDataUpdate = useCallback((eventId, orderbookData) => {
    setEventOrderbookData(prev => ({ ...prev, [eventId]: orderbookData }));
  }, []);

  // choose price helper when user presses Yes/No in form
  const handleChoiceButtonClick = useCallback((choice) => {
    setSelectedChoice(choice);

    if (!selectedEvent) return;

    let marketPrice;
    if (selectedEvent.eventId) {
      const ob = eventOrderbookData[selectedEvent.eventId];
      if (ob && ob.bestBid !== undefined && ob.bestAsk !== undefined) {
        if (choice === 'yes') {
          marketPrice = tradeType === 'buy' ? ob.bestAsk : ob.bestBid;
        } else {
          marketPrice = tradeType === 'buy' ? (1 - ob.bestBid) : (1 - ob.bestAsk);
        }
      }
    }

    if (marketPrice === undefined && selectedEvent.price) {
      const priceMatch = selectedEvent.price.match(/(\d+)c/);
      if (priceMatch) {
        const yesCents = parseInt(priceMatch[1], 10);
        marketPrice = (choice === 'yes') ? yesCents / 100 : (100 - yesCents) / 100;
      }
    }

    if (marketPrice !== undefined) setAmount(marketPrice.toFixed(2));
  }, [selectedEvent, tradeType, eventOrderbookData]);

  // order submit
  const isErrorMessage = (message) => {
    const errorKeywords = ['Error', 'error', 'Failed', 'failed', 'Invalid', 'invalid', 'Insufficient', 'insufficient', 'Please', 'please', 'required', 'Required'];
    return errorKeywords.some(k => message.includes(k));
  };

  const handleSubmitOrder = async () => {
    if (!isAuthenticated || !user) {
      setOrderMessage('Please log in to place orders');
      return;
    }
    if (!selectedEvent || !selectedChoice || !amount || !shares) {
      setOrderMessage('Please fill in all required fields');
      return;
    }
    if (!selectedEvent.eventId) {
      setOrderMessage('No event selected');
      return;
    }

    const price = parseFloat(amount);
    const quantity = parseInt(shares, 10);

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
        quantity,
        price
      };

      const response = await fetch(`${DJANGO_API_BASE}/api/orders/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken')
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to submit order');
      }

      const result = await response.json();
      setOrderMessage(`Order submitted successfully! ${result.trades_executed} trades executed.`);
      setAmount('');
      setShares('');

      // refresh wallet
      try {
        const res = await fetch(`${DJANGO_API_BASE}/wallet/`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'X-CSRFToken': Cookies.get('csrftoken') }
        });
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.balance || 0);
        }
      } catch (err) {
        console.error("Error refreshing wallet balance: ", err);
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setOrderMessage(`Error: ${err.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  // yes/no prices for the small choice buttons
  const getYesNoPrice = () => {
    if (!selectedEvent) return { yesPrice: '50c', noPrice: '50c' };

    if (selectedEvent.eventId) {
      const data = eventOrderbookData[selectedEvent.eventId];
      if (data && data.bestBid !== undefined && data.bestAsk !== undefined) {
        let yesPrice, noPrice;
        if (tradeType === 'buy') {
          yesPrice = data.bestAsk;
          noPrice = 1 - data.bestBid;
        } else {
          yesPrice = data.bestBid;
          noPrice = 1 - data.bestAsk;
        }
        return { yesPrice: `${(yesPrice * 100).toFixed(1)}c`, noPrice: `${(noPrice * 100).toFixed(1)}c` };
      }
    }

    if (selectedEvent.price) {
      const match = selectedEvent.price.match(/(\d+)/);
      if (match) {
        const yesCents = parseInt(match[1], 10);
        return { yesPrice: `${yesCents}c`, noPrice: `${100 - yesCents}c` };
      }
    }

    return { yesPrice: '50c', noPrice: '50c' };
  };

  const { yesPrice, noPrice } = getYesNoPrice();

  if (loading) return <div className="place-position">Loading market data...</div>;
  
  if (error) {
    return (
      <div className="market-not-found-overlay">
        <div className="market-not-found-modal">
          <h2 className="market-not-found-title">
            Market Not Found
          </h2>
          <p className="market-not-found-message">
            {error.message}
          </p>
          <p className="market-not-found-description">
            This market may have been closed, settled, or doesn't exist.
          </p>
          <button 
            className="market-not-found-button"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  if (!market) return <div className="place-position">Market not found</div>;

  // Check if market is closed/settled
  const isMarketClosed = market.status === 'closed' || 
    (market.events && market.events.some(event => event.settled));

  if (isMarketClosed) {
    return (
      <div className="market-closed-overlay">
        <div className="market-closed-modal">
          <h2 className="market-closed-title">
            Market Closed
          </h2>
          <p className="market-closed-message">
            This market is no longer accepting new orders as all events have been settled.
          </p>
          <p className="market-closed-description">
            All trading has been disabled for this market.
          </p>
        </div>
      </div>
    );
  }

  const events = market.events.map(e => ({
    outcomeName: e.name,
    price: `${Number(e.price).toFixed(2)}c`,
    chance: `${Number(e.price).toFixed(2)}%`,
    volume: e.volume,
    eventId: e.id
  }));

  return (
    <div className="place-position">
      <div className="place-position__left">
        <div className="place-position__left-content">
          <div className="place-position__title place-position__title--market">{market.name}</div>
          <div className="place-position__subtitle">Volume: ${market.market_volume.toLocaleString()}</div>
          <div className="place-position__timestamp">
            {market.events && market.events.length > 0 && market.events[0].expiration_date 
              ? new Date(market.events[0].expiration_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })
              : 'No expiration date'
            }
          </div>

          <MarketEventsTable
            events={events}
            onSelectEvent={(ev, choice) => handleSelectEvent(ev, choice)}
            marketId={marketId}
            onEventDataUpdate={handleEventDataUpdate}
          />
        </div>
      </div>

      <div className="place-position__right">
        {/* right header: inline Buy/Sell dropdown above position title */}
        <div className="place-position__right-header" style={{alignItems: 'center', justifyContent: 'space-between'}}>
          <div className="place-position__title place-position__title--position">
            {selectedEvent ? selectedEvent.outcomeName : 'Position Name Goes Here'}
          </div>

          {/* container so the menu can be absolutely positioned relative to the button */}
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <button
                type="button"
                className={`trade-dropdown orderbook-btn ${tradeType === 'buy' ? 'buy' : 'sell'} ${tradeDropdownOpen ? 'open' : ''}`}
                onClick={toggleTradeDropdown}
                aria-expanded={tradeDropdownOpen}
                aria-haspopup="true"
            >
              <span className="trade-dropdown-text">{tradeType === 'buy' ? 'Buy' : 'Sell'}</span>
              <span className="iconify trade-dropdown-icon" data-icon="ri:arrow-down-s-line" data-inline="false"
                    aria-hidden="true"/>
            </button>

            {tradeDropdownOpen && (
                <div className="trade-dropdown-menu" role="menu" aria-label="Select trade type">
                  <div className="trade-dropdown-item" role="menuitem" onClick={() => selectTradeType('buy')}>Buy</div>
                  <div className="trade-dropdown-item" role="menuitem" onClick={() => selectTradeType('sell')}>Sell
                  </div>
                </div>
            )}
          </div>
        </div>

        <div className="place-position__info-container">
          <div className="place-position__outcome">
            <div className="place-position__subtitle">Outcome</div>
            <div className="place-position__icon">
              <span className="iconify" data-icon="ri:information-2-line" data-inline="false"/>
            </div>
          </div>

          {/* big Yes/No buttons in the form area (kept behaviour) */}
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

          <div className="place-position__form-row">
            <div className="place-position__form-label">Limit Price</div>
            <div className="place-position__input place-position__input--compact" aria-label="Limit price input">
              <button className="place-position__input-button" aria-label="Decrease amount" onClick={handleDecrease}>
                <span className="iconify" data-icon="ri:subtract-line" data-inline="false"/>
              </button>
              <label className="place-position__input-field" aria-hidden="false">
                <div className="place-position__input-center">
                  <span className="place-position__currency">$</span>
                  <input type="text" placeholder="0.00" value={amount} onChange={handleInputChange}
                         aria-label="Enter limit price"/>
                </div>
              </label>
              <button className="place-position__input-button" aria-label="Increase amount" onClick={handleIncrease}>
                <span className="iconify" data-icon="ri:add-large-fill" data-inline="false"/>
              </button>
            </div>
          </div>

          <div className="place-position__form-row">
            <div className="place-position__form-label">Shares</div>
            <div className="place-position__simple-input" aria-label="Shares input">
              <input type="text" placeholder="0" value={shares} onChange={handleSharesChange}
                     aria-label="Enter number of shares"/>
            </div>
          </div>

          <button className="place-position__button--buy" onClick={handleSubmitOrder} disabled={submittingOrder}>
            {submittingOrder ? 'Submitting...' : (tradeType === 'buy' ? 'Buy' : 'Sell')}
          </button>

          {orderMessage && <div
              className={`order-message ${isErrorMessage(orderMessage) ? 'error' : 'success'}`}>{orderMessage}</div>}

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
