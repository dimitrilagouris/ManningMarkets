// API Configuration - uses environment variables with fallback to localhost
export const DJANGO_API_BASE = process.env.REACT_APP_DJANGO_API_BASE || "http://localhost:8000";

// WebSocket Configuration - uses environment variables with fallback to localhost
// For WebSocket, we need to convert http:// to ws:// or https:// to wss://
const getWebSocketUrl = () => {
  const apiBase = process.env.REACT_APP_DJANGO_API_BASE || "http://localhost:8000";
  // Convert http:// to ws:// and https:// to wss://
  if (apiBase.startsWith('https://')) {
    return apiBase.replace('https://', 'wss://');
  } else if (apiBase.startsWith('http://')) {
    return apiBase.replace('http://', 'ws://');
  }
  // If no protocol, assume ws://
  return apiBase.startsWith('ws://') || apiBase.startsWith('wss://') ? apiBase : `ws://${apiBase}`;
};

export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || getWebSocketUrl();