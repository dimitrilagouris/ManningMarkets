/**
 * Application configuration and environment variables.
 */

/** @type {string} */
export const DJANGO_API_BASE = process.env.REACT_APP_DJANGO_API_BASE || 'http://localhost:8000';

/**
 * Derives the WebSocket URL from the base API URL by swapping protocols.
 * * @param {string} apiBase - The HTTP base URL to convert.
 * @returns {string} The corresponding WebSocket URL.
 */
const deriveWebSocketUrl = (apiBase) => {
  if (apiBase.startsWith('https://')) {
    return apiBase.replace('https://', 'wss://');
  }
  if (apiBase.startsWith('http://')) {
    return apiBase.replace('http://', 'ws://');
  }

  const isAlreadyWs = apiBase.startsWith('ws://') || apiBase.startsWith('wss://');
  return isAlreadyWs ? apiBase : `ws://${apiBase}`;
};

/** @type {string} */
export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || deriveWebSocketUrl(DJANGO_API_BASE);