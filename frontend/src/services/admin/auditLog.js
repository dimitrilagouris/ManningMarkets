import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';

/**
 * Renders the audit log list directly below the tabs.
 */
export const AuditLogs = ({ auditLogs }) => (
  <div className="audit-log" style={{ marginTop: 0 }}>
    {auditLogs.map(log => (
      <div key={log.id} className="audit-log-item">
        <div className="audit-log-icon"><FontAwesomeIcon icon={faShieldAlt} /></div>
        <div className="audit-log-content">
          <p className="audit-log-action"><strong>{log.admin}</strong> {log.action}: <em>{log.target}</em></p>
          <p className="audit-log-timestamp">{log.timestamp}</p>
        </div>
      </div>
    ))}
  </div>
);

AuditLogs.propTypes = { auditLogs: PropTypes.array.isRequired };