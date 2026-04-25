import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders an individual statistic with a bold red value and black label.
 * @param {Object} props - Component properties.
 * @returns {JSX.Element}
 */
export const StatCard = ({ value, label }) => (
  <div style={{
    flex: '1 1 0',
    padding: '32px 24px',
    minWidth: '150px',
    backgroundColor: 'var(--usyd-grey-100)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  }}>
    <div style={{
      color: 'var(--usyd-red, #D9381E)',
      fontSize: '40px',
      fontWeight: 'bold',
      marginBottom: '8px',
      lineHeight: '1'
    }}>
      {value}
    </div>
    <div style={{
      color: '#000000',
      fontSize: '16px',
    }}>
      {label}
    </div>
  </div>
);

StatCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
};