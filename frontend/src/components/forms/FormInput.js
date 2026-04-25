import React from 'react';
import PropTypes from 'prop-types';

import './Input.css';

/**
 * Renders a styled form input supporting labels, icons, and numerical constraints.
 * @param {Object} props
 * @returns {React.JSX.Element}
 */
export const FormInput = ({
  type = 'text',
  value,
  onChange,
  placeholder = '',
  label = '',
  height = 'standard',
  fill = 'default',
  fullWidth = false,
  icon = null,
  min,
  max,
  step
}) => {
  const wrapperClasses = [
    'form-input-wrapper',
    `form-input-wrapper--${height}`,
    `form-input-wrapper--fill-${fill}`,
    fullWidth ? 'form-input-wrapper--full-width' : ''
  ].filter(Boolean).join(' ');

  const inputElement = (
    <div className={wrapperClasses}>
      {icon && <span className="form-input-icon">{icon}</span>}
      <input
        type={type}
        className="form-input-field"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={label || placeholder}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );

  return label ? (
    <label className="form-group">
      <span className="form-label">{label}</span>
      {inputElement}
    </label>
  ) : inputElement;
};

FormInput.propTypes = {
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  height: PropTypes.oneOf(['standard', 'tall']),
  fill: PropTypes.oneOf(['default', 'white']),
  fullWidth: PropTypes.bool,
  icon: PropTypes.node,
  min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  step: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};