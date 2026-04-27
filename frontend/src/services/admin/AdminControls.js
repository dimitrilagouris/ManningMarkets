import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { Button } from '../../components/buttons/Button';
import { SearchBar } from '../../components/forms/SearchBar';

/**
 * Dropdown menu for filter options.
 * @param {{ opts: Array<{val: string, lbl: string}>, currentStatus: string, onSelect: function(string): void }} props
 * @returns {React.JSX.Element}
 */
const FilterMenu = ({ opts, currentStatus, onSelect }) => (
    <div style={{
        position: 'absolute', right: 0, top: '100%', marginTop: '4px',
        background: 'white', border: '1px solid #e0e0e0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: '140px'
    }}>
        {opts.map(o => (
            <div
                key={o.val}
                onClick={() => onSelect(o.val)}
                style={{
                    padding: '10px 16px', cursor: 'pointer',
                    background: currentStatus === o.val ? '#f9f9f9' : 'transparent'
                }}
            >
                {o.lbl}
            </div>
        ))}
    </div>
);

/**
 * Dynamic search and filter controls.
 * @param {{ activeTab: string, setSearchTerm: function(string): void, filterStatus: string, setFilterStatus: function(string): void }} props
 * @returns {React.JSX.Element}
 */
export const AdminControls = ({ activeTab, setSearchTerm, filterStatus, setFilterStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  const config = {
    'Users': { placeholder: 'Search users by name or email...', opts: [{val: 'all', lbl: 'All Status'}, {val: 'active', lbl: 'Active'}, {val: 'suspended', lbl: 'Suspended'}] },
    'Markets': { placeholder: 'Search markets by title...', opts: [{val: 'all', lbl: 'All Status'}, {val: 'active', lbl: 'Active'}, {val: 'closed', lbl: 'Closed'}] },
    'Audit Log': { placeholder: 'Search audit logs by admin or action...', opts: [{val: 'all', lbl: 'All Actions'}, {val: 'user', lbl: 'User Actions'}, {val: 'market', lbl: 'Market Actions'}] }
  };

  const { placeholder, opts } = config[activeTab];
  const currentLabel = opts.find(o => o.val === filterStatus)?.lbl || 'Filter';

  /** @type {function(string): void} */
  const handleSelect = (val) => {
    setFilterStatus(val);
    setIsOpen(false);
  };

  return (
    <div className="admin-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem', width: '100%' }}>

      <SearchBar
        fullWidth={true}
        placeholderText={placeholder}
        onSearch={setSearchTerm}
      />

      <div style={{ alignSelf: 'flex-end', position: 'relative' }}>
        <Button
            fill="link"
            textColor="primary"
            onClick={() => setIsOpen(!isOpen)}
        >
            {currentLabel}
        </Button>

        {isOpen && <FilterMenu opts={opts} currentStatus={filterStatus} onSelect={handleSelect} />}
      </div>

    </div>
  );
};

AdminControls.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  filterStatus: PropTypes.string.isRequired,
  setFilterStatus: PropTypes.func.isRequired,
};