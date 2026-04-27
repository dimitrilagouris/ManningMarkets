import { DJANGO_API_BASE } from '../config';

/**
 * Retrieves the CSRF token from the backend.
 * @returns {Promise<string|null>}
 */
export const getCSRFToken = async () => {
    try {
        const res = await fetch(`${DJANGO_API_BASE}/get-csrf-token/`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'include',
        });
        return res.ok ? (await res.json()).csrfToken : null;
    } catch {
        return null;
    }
};

/**
 * Standardised fetch wrapper for admin API endpoints.
 * @param {string} endpoint
 * @returns {Promise<Object>}
 */
export const fetchAdminData = async (endpoint) => {
    const res = await fetch(`${DJANGO_API_BASE}/api/admin/${endpoint}`, { credentials: 'include' });
    if (!res.ok) {
        const error = new Error(`Failed to fetch ${endpoint}`);
        error.status = res.status;
        throw error;
    }
    return res.json();
};

/**
 * Executes a state-modifying action on a user.
 * @param {string} userId
 * @param {string} action
 * @param {string} method
 * @param {Object} [body]
 * @returns {Promise<Object>}
 */
export const executeUserAction = async (userId, action, method = 'POST', body = null) => {
    const token = await getCSRFToken();
    const options = {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${DJANGO_API_BASE}/api/admin/users/${userId}/${action}/`, options);
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.error || `Failed to execute ${action}`);
        error.status = res.status;
        throw error;
    }
    return data;
};