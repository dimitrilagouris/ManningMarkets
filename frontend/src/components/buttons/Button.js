import React from 'react';
import PropTypes from 'prop-types';

import './Button.css';

/**
 * A highly configurable button supporting multiple visual states and layouts.
 *
 * @param {Object} props
 * @param {'x-short'|'short'|'medium'|'large'} [props.height='medium']
 * @param {'primary'|'none'|'light'|'dark'|'link'} [props.fill='primary']
 * @param {'primary'|'none'|'light'|'dark'} [props.outline='none']
 * @param {'full'|'auto'|string} [props.width='auto']
 * @param {'light'|'dark'|'primary'} [props.textColor='light']
 * @param {'inherit'|'primary'} [props.iconColor='inherit']
 * @param {boolean} [props.isSelectable=false]
 * @param {boolean} [props.isSelected=false]
 * @param {'default'|'outline-primary'} [props.selectedVariant='default']
 * @param {boolean} [props.isHoverable=true]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.icon=null]
 * @param {'left'|'right'} [props.iconPosition='left']
 * @param {React.ReactNode} props.children
 * @param {function(React.MouseEvent): void} [props.onClick]
 */
export const Button = ({
  height = 'medium', fill = 'primary', outline = 'none', width = 'auto',
  textColor = 'light', iconColor = 'inherit',
  isSelectable = false, isSelected = false, selectedVariant = 'default',
  isHoverable = true, disabled = false, icon = null, iconPosition = 'left',
  children, onClick
}) => {

  /** @type {boolean} */
  const isActuallySelected = isSelectable && isSelected;

  /** @type {string} */
  const selectedClass = isActuallySelected
    ? (selectedVariant === 'outline-primary' ? 'btn-selected-outline-primary' : 'btn-selected')
    : '';

  /** @type {string} */
  const classes = [
    'custom-button',
    `btn-h-${height}`,
    `btn-fill-${fill}`,
    `btn-outline-${outline}`,
    textColor === 'dark' ? 'btn-text-dark' : '',
    textColor === 'primary' ? 'btn-text-primary' : '',
    iconColor === 'primary' ? 'btn-icon-primary' : '',
    width === 'full' ? 'btn-w-full' : '',
    isHoverable && !disabled ? 'btn-hoverable' : '',
    selectedClass
  ].filter(Boolean).join(' ');

  /** @type {Object<string, string>} */
  const customWidth = !['full', 'auto'].includes(width) ? { width } : {};

  return (
    <button className={classes} style={customWidth} onClick={onClick} disabled={disabled}>
      {icon && iconPosition === 'left' && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-text">{children}</span>}
      {icon && iconPosition === 'right' && <span className="btn-icon">{icon}</span>}
    </button>
  );
};

Button.propTypes = {
  height: PropTypes.oneOf(['x-short', 'short', 'medium', 'large']),
  fill: PropTypes.oneOf(['primary', 'none', 'light', 'dark', 'link']),
  outline: PropTypes.oneOf(['primary', 'none', 'light', 'dark']),
  width: PropTypes.string,
  textColor: PropTypes.oneOf(['light', 'dark', 'primary']),
  iconColor: PropTypes.oneOf(['inherit', 'primary']),
  isSelectable: PropTypes.bool,
  isSelected: PropTypes.bool,
  selectedVariant: PropTypes.oneOf(['default', 'outline-primary']),
  isHoverable: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
};