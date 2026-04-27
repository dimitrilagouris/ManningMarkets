import axios from 'axios';
import { DJANGO_API_BASE } from '../config';

/**
 * Reads Django's CSRF token from the cookie jar.
 * Django sets this automatically on the first GET — must be present before any POST.
 * @returns {string|null} The CSRF token, or null if not yet set.
 */
const getCsrfToken = () => {
    const match = document.cookie.match(/csrftoken=([^;]+)/);
    return match ? match[1] : null;
};

/**
 * Axios instance for all Django API calls.
 * Sends session cookies and CSRF token automatically on every request.
 */
const clientApi = axios.create({
    baseURL: DJANGO_API_BASE,
    withCredentials: true, // required for session cookie to be sent cross-origin
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

// Attach the CSRF token to every mutating request.
// Without this, Django's CsrfViewMiddleware will return 403
clientApi.interceptors.request.use(config => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
});

// Redirect to login on any auth failure — handles expired sessions globally.
clientApi.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default clientApi;