import React, {useEffect, useState} from 'react';
import Market from './market';
import { DJANGO_API_BASE } from '../config';

function Markets() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    const fetchMarkets = async () => {
      try {
        const res = await fetch(`${DJANGO_API_BASE}/fetch_markets/`, {
          headers: {'X-Requested-With': 'XMLHttpRequest'}
        });

        if (!res.ok)
        {
          throw new Error('Failed to fetch markets');
        }

        const data = await res.json();
        setMarkets(data.markets);

      }
    
      catch (err) {
        console.error("Fetching Markets Errror: ", err);
        setError(err);

      }
      finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  
  }, []);

  if (loading)
  {
    return <main className="main-content"> <div>Loading Markets... </div> </main>
  }

  if (error)
  {
    return <main className="main-content"> <div>Error Loading Markets: {error.message || 'Unknown error occurred'} </div> </main>
  }

  return (
    <main className="main-content">
      <div className="markets-container">
          {markets.map((market) => (
            <Market key={market.id} market={market} />
          ))}
          {markets.length === 0 && <div>No Markets avaliable.</div>}
      </div>
    </main>
  );
}

export default Markets;
