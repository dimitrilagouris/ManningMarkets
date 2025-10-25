import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Market from './market';
import { DJANGO_API_BASE } from '../config';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function Markets() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const query = useQuery();
  const searchTerm = query.get('search') || ''; // your Header navigates to /markets?search=...

  useEffect(() => {
    let isMounted = true; // avoid state updates after unmount

    const fetchMarkets = async () => {
      setLoading(true);
      setError(null);

      try {
        // build the URL. Backend expects q for the search; send only when present
        const base = `${DJANGO_API_BASE}/fetch_markets/`;
        const url = searchTerm ? `${base}?q=${encodeURIComponent(searchTerm)}` : base;

        const res = await fetch(url, {
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch markets (${res.status})`);
        }

        const data = await res.json();

        if (isMounted) {
          setMarkets(data.markets || []);
        }
      } catch (err) {
        console.error('Fetching Markets Error:', err);
        if (isMounted) {
          setError(err);
          setMarkets([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMarkets();

    return () => {
      isMounted = false;
    };
  }, [searchTerm]); // re-run when ?search= changes

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
        <div>Error Loading Markets: {error.message || 'Unknown error occurred'}</div>
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

export default Markets;
