/**
 * Formats an ISO date string into a local Sydney timestamp.
 * @param {string} isoString - The ISO 8601 date string to format.
 * @returns {string} The formatted local date string.
 */
export const formatDate = (isoString) => {
    if (!isoString) return 'Never';

    return new Date(isoString).toLocaleString('en-AU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: 'Australia/Sydney'
    });
};