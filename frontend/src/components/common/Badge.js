// Badge.jsx
import React from 'react';
import PropTypes from 'prop-types';

const COLOURS = {
  green:  { background: '#d4edda', color: '#155724' },
  red:    { background: '#f8d7da', color: '#721c24' },
  yellow: { background: '#fff3cd', color: '#856404' },
  blue:   { background: '#cce5ff', color: '#004085' },
  grey:   { background: '#e2e3e5', color: '#383d41' },
};

const Badge = ({ label, colour = 'grey', width = null }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '23px',
      padding: '0 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
      ...(width ? { width } : {}),
      ...COLOURS[colour],
    }}
  >
    {label}
  </span>
);

Badge.propTypes = {
  label:  PropTypes.string.isRequired,
  colour: PropTypes.oneOf(Object.keys(COLOURS)),
  /** Fixed width e.g. 80 (number of px) or '5rem' (string). Omit to hug text. */
  width:  PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default Badge;