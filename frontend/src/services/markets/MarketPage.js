import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import clientApi from '../../api/clientApi';
import Market from './Market';

/**
 * @typedef {Object} MarketData
 * @property {number|string} id
 * @property {string} name
 */

/**
 * Retrieves the query parameters from the active URL.
 * @returns {URLSearchParams}
 */
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

/**
 * Requests the active market list from the server.
 * @param {string} searchTerm
 * @returns {Promise<MarketData[]>}
 */
const getMarketsList = async (searchTerm) => {
    const endpoint = searchTerm
        ? `/fetch_markets/?q=${encodeURIComponent(searchTerm)}`
        : `/fetch_markets/`;

    const { data } = await clientApi.get(endpoint);
    return data.markets || [];
};

/**
 * Top-level view for exploring available markets.
 * @returns {React.JSX.Element}
 */
export default function MarketPage() {
    /** @type {[MarketData[], React.Dispatch<React.SetStateAction<MarketData[]>>]} */
    const [markets, setMarkets] = useState([]);
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(true);
    /** @type {[Error|null, React.Dispatch<React.SetStateAction<Error|null>>]} */
    const [error, setError] = useState(null);

    const query = useQuery();
    const searchTerm = query.get('search') || '';

    useEffect(() => {
        let isMounted = true;

        const loadMarkets = async () => {
            setLoading(true);
            setError(null);

            try {
                const fetchedMarkets = await getMarketsList(searchTerm);
                if (isMounted) setMarkets(fetchedMarkets);
            } catch (err) {
                if (isMounted) {
                    setError(err);
                    setMarkets([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadMarkets();

        return () => {
            isMounted = false;
        };
    }, [searchTerm]);

    if (loading) {
        return (
            <main className="main-content">
                <div>Loading Markets...</div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="main-content">
                <div role="alert">Error Loading Markets: {error.message || 'Unknown error occurred'}</div>
            </main>
        );
    }

    return (
        <main className="main-content">
            <div className="markets-container">
                {markets.map((market) => (
                    <Market key={market.id} market={market} />
                ))}
                {markets.length === 0 && <div>No markets available.</div>}
            </div>
        </main>
    );
}