import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './Input.css';

/**
 * Reusable search bar for querying markets or other data.
 * @param {Object} props
 * @param {boolean} [props.fullWidth=false]
 * @param {string} [props.placeholderText='Search...']
 * @param {function(string): void} props.onSearch
 */
export const SearchBar = ({
  fullWidth = false,
  placeholderText = 'Search...',
  onSearch
}) => {
  const [query, setQuery] = useState('');

  /** @param {React.FormEvent} e */
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form
      className={`search-bar ${fullWidth ? 'search-bar--full-width' : ''}`}
      role="search"
      onSubmit={handleSubmit}
    >
      <input
        className="search-bar__input"
        type="search"
        placeholder={placeholderText}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={placeholderText}
      />
      <button className="search-bar__submit" type="submit" aria-label="Submit search">
        <span className="iconify" data-icon="ri:search-line" data-inline="false"></span>
      </button>
    </form>
  );
};

SearchBar.propTypes = {
  fullWidth: PropTypes.bool,
  placeholderText: PropTypes.string,
  onSearch: PropTypes.func.isRequired,
};