import { DJANGO_API_BASE } from '../config';
import Cookies from 'js-cookie';

/**
 * Fetches market details and events by ID.
 * @param {string|number} marketId
 * @returns {Promise<Object>}
 */
export const fetchMarketData = async (marketId) => {
  const res = await fetch(`${DJANGO_API_BASE}/fetch_market/${marketId}/`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });
  if (!res.ok) throw new Error(res.status === 404 ? 'Market not found' : 'Failed to fetch market');
  return res.json();
};

/**
 * Retrieves the current authenticated user's wallet balance.
 * @returns {Promise<Object>}
 */
export const fetchWalletBalance = async () => {
  const res = await fetch(`${DJANGO_API_BASE}/wallet/`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'X-CSRFToken': Cookies.get('csrftoken') }
  });
  if (!res.ok) throw new Error('Failed to fetch wallet');
  return res.json();
};