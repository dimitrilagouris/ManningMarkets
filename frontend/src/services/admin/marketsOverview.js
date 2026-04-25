import React from 'react';
import PropTypes from 'prop-types';

const gridStyle = { display: 'grid', gridTemplateColumns: '0.5fr 3fr 1fr 1fr 1.5fr', alignItems: 'center' };

/**
 * Renders the markets table directly below the tabs.
 */
export const MarketsOverview = ({ markets }) => (
  <div className="wallet-transactions-table" role="table" aria-label="MarketPage overview list" style={{ marginTop: 0 }}>
    <div className="wallet-transactions-header" role="row" style={gridStyle}>
      <div className="wallet-table-col">ID</div><div className="wallet-table-col">Market Title</div>
      <div className="wallet-table-col">Status</div><div className="wallet-table-col">Participants</div>
      <div className="wallet-table-col">Volume (Pts)</div>
    </div>
    <div className="wallet-transactions-body" role="rowgroup">
      {markets.map((market, idx) => (
        <div key={market.id} className={`wallet-transactions-row ${idx % 2 === 1 ? 'wallet-transactions-row--alt' : ''}`} role="row" style={gridStyle}>
          <div className="wallet-table-col" role="cell">{market.id}</div>
          <div className="wallet-table-col" role="cell"><div className="event-text">{market.market_name}</div></div>
          <div className="wallet-table-col" role="cell"><span className={`status-badge status-badge--${market.status.toLowerCase()}`}>{market.status}</span></div>
          <div className="wallet-table-col" role="cell">{market.participants}</div>
          <div className="wallet-table-col" role="cell">{market.volume?.toLocaleString() || 0}</div>
        </div>
      ))}
    </div>
  </div>
);

MarketsOverview.propTypes = { markets: PropTypes.array.isRequired };