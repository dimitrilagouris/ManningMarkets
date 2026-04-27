import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import PropTypes from 'prop-types';
import clientApi from '../../api/clientApi';
import { AuthContext } from '../../auth-pages/authentication_context';
import { MarketEventsTable } from '../../components/tables/place-position/MarketEventsTable';
import { OrderForm } from './OrderForm';

import './placePosition.css';
import '../../styles/base.css';

/**
 * @typedef {Object} MarketEvent
 * @property {number|string} id
 * @property {string} name
 * @property {number|string} price
 * @property {string} expiration_date
 * @property {boolean} settled
 */

/**
 * @typedef {Object} Market
 * @property {number|string} id
 * @property {string} name
 * @property {number} market_volume
 * @property {string} status
 * @property {MarketEvent[]} events
 */

/**
 * Retrieves market details and associated events.
 * @param {string|number} marketId
 * @returns {Promise<Market>}
 */
const getMarketData = async (marketId) => {
    const { data } = await clientApi.get(`/fetch_market/${marketId}/`);
    return data.market;
};

/**
 * Retrieves the authenticated user's available balance.
 * @returns {Promise<number>}
 */
const getWalletBalance = async () => {
    const { data } = await clientApi.get('/wallet/');
    return data.balance || 0;
};

/**
 * Renders the primary market details.
 * @param {{ market: Market }} props
 * @returns {JSX.Element}
 */
const MarketHeader = ({ market }) => (
    <>
        <div className="place-position__title place-position__title--market">{market.name}</div>
        <div className="place-position__subtitle">Volume: ${market.market_volume?.toLocaleString() || 0}</div>
        <div className="place-position__timestamp">
            {market.events?.[0]?.expiration_date
                ? new Date(market.events[0].expiration_date).toLocaleDateString('en-GB', {
                    year: 'numeric', month: 'long', day: 'numeric'
                })
                : 'No expiration date'}
        </div>
    </>
);

MarketHeader.propTypes = { market: PropTypes.object.isRequired };

/**
 * Renders an error overlay for missing or failed markets.
 * @param {{ message: string }} props
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
 * Renders an overlay indicating the market has concluded trading.
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

export const PlacePositionPage = () => {
    /** @type {{ marketId: string }} */
    const { marketId } = useParams();
    const { isAuthenticated } = useContext(AuthContext);

    /** @type {[Market|null, React.Dispatch<React.SetStateAction<Market|null>>]} */
    const [market, setMarket] = useState(null);
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(true);
    /** @type {[Error|null, React.Dispatch<React.SetStateAction<Error|null>>]} */
    const [error, setError] = useState(null);
    /** @type {[number, React.Dispatch<React.SetStateAction<number>>]} */
    const [walletBalance, setWalletBalance] = useState(0);

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedChoice, setSelectedChoice] = useState('yes');
    const [eventOrderbookData, setEventOrderbookData] = useState({});

    const reloadWallet = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const balance = await getWalletBalance();
            setWalletBalance(balance);
        } catch {
            setWalletBalance(0);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        const initPageData = async () => {
            try {
                setLoading(true);
                const fetchedMarket = await getMarketData(marketId);
                setMarket(fetchedMarket);

                if (fetchedMarket.events?.length > 0) {
                    const firstEvent = fetchedMarket.events[0];
                    setSelectedEvent({
                        outcomeName: firstEvent.name,
                        price: `${firstEvent.price}c`,
                        eventId: firstEvent.id
                    });
                }
            } catch (err) {
                setError(err.response?.status === 404 ? new Error('Market not found') : err);
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

    const formattedEvents = market.events.map(e => ({
        outcomeName: e.name,
        price: `${Number(e.price).toFixed(2)}c`,
        eventId: e.id
    }));

    return (
        <div className="place-position">
            <div className="place-position__left">
                <div className="place-position__left-content">
                    <MarketHeader market={market} />
                    <MarketEventsTable
                        events={formattedEvents}
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