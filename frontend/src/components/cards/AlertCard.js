import React from 'react';
import PropTypes from 'prop-types';

import './AlertCard.css';

/**
 * Renders an informational alert card for disclaimers or notices.
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.description
 * @param {'success'|'error'} [props.type]
 * @returns {React.JSX.Element}
 */
export const AlertCard = ({ title, description, type }) => {
  return (
    <div className="alert-card">
      {title && <h2 className="alert-card__title">{title}</h2>}
      <div className="alert-card__description">
        {description}
      </div>
    </div>
  );
};

AlertCard.propTypes = {
  title: PropTypes.string,
  description: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['success', 'error']),
};