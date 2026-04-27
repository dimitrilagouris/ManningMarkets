// AuditLogsTable.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../table.css';

/**
 * Renders a single row within the audit log table.
 */
const AuditLogRow = ({ log, isAlt }) => {
    const rowClass = `table-row ${isAlt ? 'table-row--alt' : ''}`;

    return (
        <div className={rowClass} role="row">
            <div className="table-col" role="cell" style={{ fontWeight: 600 }}>
                {log.admin}
            </div>
            <div className="table-col" role="cell">
                {log.action}
            </div>
            <div className="table-col" role="cell" style={{ color: 'var(--usyd-grey-600)' }}>
                {log.timestamp}
            </div>
        </div>
    );
};

/**
 * Displays a structured table of system audit logs.
 * @param {Object} props
 * @param {Array} props.auditLogs - List of administrative actions.
 * @returns {React.JSX.Element}
 */
const AuditLogsTable = ({ auditLogs }) => (
    <div className="table-container audit-table" role="table" aria-label="System audit logs">
        <div className="table-header" role="row">
            <div className="table-col">Admin</div>
            <div className="table-col">Action</div>
            <div className="table-col">Timestamp</div>
        </div>
        <div className="table-body" role="rowgroup">
            {auditLogs.map((log, idx) => (
                <AuditLogRow
                    key={log.id}
                    log={log}
                    isAlt={idx % 2 === 1}
                />
            ))}
        </div>
    </div>
);

const LogShape = PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    admin: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
});

AuditLogRow.propTypes = {
    log: LogShape.isRequired,
    isAlt: PropTypes.bool.isRequired,
};

AuditLogsTable.propTypes = {
    auditLogs: PropTypes.arrayOf(LogShape).isRequired,
};

export default AuditLogsTable;