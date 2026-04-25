import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from '../../auth-pages/authentication_context';
import { MarketEventsTable } from '../../components/tables/place-position/MarketEventsTable';
import { OrderForm } from './OrderForm';
import { fetchMarketData, fetchWalletBalance } from './marketApi';
import PropTypes from 'prop-types';

import './placePosition.css';
import '../../styles/base.css';

/**
 * Renders the market title, volume, and expiration date.
 * @param {Object} props
 * @returns {JSX.Element}
 */
const MarketHeader = ({ market }) => (
  <>
    <div className="place-position__title place-position__title--market">{market.name}</div>
    <div className="place-position__subtitle">Volume: ${market.market_volume?.toLocaleString() || 0}</div>
    <div className="place-position__timestamp">
      {market.events?.[0]?.expiration_date
        ? new Date(market.events[0].expiration_date).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
          })
        : 'No expiration date'}
    </div>
  </>
);

MarketHeader.propTypes = { market: PropTypes.object.isRequired };

/**
 * Renders the error overlay when a market is missing or errors out.
 * @param {Object} props
 * @returns {JSX.Element}
 */
const ErrorOverlay = ({ message }) => (
  <div className="market-not-found-overlay">
    <div className="market-not-found-modal">
      <h2 className="market-not-found-title">Market Not Found</h2>
      <p className="market-not-found-message">{message}</p>
      <p className="market-not-found-description">This market may have been closed, settled, or doesn't exist.</p>
      <button className="market-not-found-button" onClick={() => window.history.back()}>Go Back</button>
    </div>
  </div>
);

ErrorOverlay.propTypes = { message: PropTypes.string.isRequired };

/**
 * Renders the closed market overlay preventing new orders.
 * @returns {JSX.Element}
 */
const ClosedMarketOverlay = () => (
  <div className="market-closed-overlay">
    <div className="market-closed-modal">
      <h2 className="market-closed-title">Market Closed</h2>
      <p className="market-closed-message">This market is no longer accepting new orders as all events have been settled.</p>
      <p className="market-closed-description">All trading has been disabled for this market.</p>
    </div>
  </div>
);

/**
 * Root container mapping market events to the order submission panel.
 * @returns {JSX.Element}
 */
export const PlacePositionPage = () => {
  const { marketId } = useParams();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState('yes');
  const [eventOrderbookData, setEventOrderbookData] = useState({});

  const reloadWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchWalletBalance();
      setWalletBalance(data.balance || 0);
    } catch (err) {
      setWalletBalance(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const initPageData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData(marketId);
        setMarket(data.market);
        if (data.market.events?.length > 0) {
          setSelectedEvent({ outcomeName: data.market.events[0].name, price: `${data.market.events[0].price}c`, eventId: data.market.events[0].id });
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    if (marketId) initPageData();
    reloadWallet();
  }, [marketId, reloadWallet]);

  const handleSelectEvent = useCallback((event, choice) => {
    setSelectedEvent(event);
    setSelectedChoice(choice);
  }, []);

  const handleEventDataUpdate = useCallback((eventId, orderbookData) => {
    setEventOrderbookData(prev => ({ ...prev, [eventId]: orderbookData }));
  }, []);

  if (loading) return <div className="place-position">Loading market data...</div>;
  if (error) return <ErrorOverlay message={error.message} />;
  if (!market) return <div className="place-position">Market not found</div>;

  const isMarketClosed = market.status === 'closed' || market.events?.some(e => e.settled);
  if (isMarketClosed) return <ClosedMarketOverlay />;

  const events = market.events.map(e => ({ outcomeName: e.name, price: `${Number(e.price).toFixed(2)}c`, eventId: e.id }));

  return (
    <div className="place-position">
      <div className="place-position__left">
        <div className="place-position__left-content">
          <MarketHeader market={market} />

          <MarketEventsTable
            events={events}
            onSelectEvent={handleSelectEvent}
            onEventDataUpdate={handleEventDataUpdate}
          />
        </div>
      </div>

      <div className="place-position__right">
        <OrderForm
          selectedEvent={selectedEvent}
          initialChoice={selectedChoice}
          walletBalance={walletBalance}
          eventOrderbookData={eventOrderbookData}
          onOrderSuccess={reloadWallet}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
};