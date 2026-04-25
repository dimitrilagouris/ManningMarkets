import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Market from './Market';
import { DJANGO_API_BASE } from '../../config';

/**
 * Parses the current URL query parameters.
 * @returns {URLSearchParams} The parsed search parameters from the active route.
 */
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

/**
 * Fetches the list of active markets from the backend API.
 * @param {string} searchTerm - The optional query string to filter markets.
 * @returns {Promise<Object[]>} A promise resolving to an array of market data objects.
 */
async function fetchMarketsApi(searchTerm) {
  const base = `${DJANGO_API_BASE}/fetch_markets/`;
  const url = searchTerm ? `${base}?q=${encodeURIComponent(searchTerm)}` : base;

  const res = await fetch(url, { credentials: 'include' });

  if (!res.ok) {
    throw new Error(`Failed to fetch markets (${res.status})`);
  }

  const data = await res.json();
  return data.markets || [];
}

/**
 * Renders the primary markets overview page.
 * Displays trading events and responds dynamically to URL search queries.
 * @returns {React.JSX.Element} The rendered page component.
 */
function MarketPage() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useQuery();
  const searchTerm = query.get('search') || '';

  useEffect(() => {
    // Guards against state updates if the component unmounts before the fetch resolves
    let isMounted = true;

    const loadMarkets = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchMarketsApi(searchTerm);
        if (isMounted) setMarkets(data);
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

export default MarketPage;