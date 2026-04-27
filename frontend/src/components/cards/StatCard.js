import React from 'react';
import PropTypes from 'prop-types';
import './StatCard.css';

/**
 * Renders an individual statistic with a bold red value and black label.
 * @param {{ value: string|number, label: string }} props
 * @returns {JSX.Element}
 */
export const StatCard = ({ value, label }) => (
  <div className="stat-card">
    <div className="stat-card__value">
      {value}
    </div>
    <div className="stat-card__label">
      {label}
    </div>
  </div>
);

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
};