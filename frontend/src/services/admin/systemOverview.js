import React from 'react';
import PropTypes from 'prop-types';
import { StatCard } from './StatCard';

/**
 * Renders the top-level system statistics across the full width of the container.
 * @param {Object} props
 * @returns {JSX.Element}
 */
export const SystemOverview = ({ stats }) => (
  <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem', borderTop: '1px solid #eaeaea', paddingTop: '1rem' }}>
    <StatCard value={stats.totalUsers || 0} label="Total Users" />
    <StatCard value={stats.activeUsers || 0} label="Active Users" />
    <StatCard value={stats.suspendedUsers || 0} label="Suspended" />
    <StatCard value={`${stats.activeMarkets || 0}/${stats.totalMarkets || 0}`} label="Active MarketPage" />
  </div>
);

SystemOverview.propTypes = {
  stats: PropTypes.shape({
    totalUsers: PropTypes.number,
    activeUsers: PropTypes.number,
    suspendedUsers: PropTypes.number,
    totalMarkets: PropTypes.number,
    activeMarkets: PropTypes.number,
  }).isRequired,
};