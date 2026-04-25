import { useState, useEffect } from "react";
import { WS_BASE_URL } from '../config';
import { useWebSocket } from './useWebsocket';

/**
 * Manages live orderbook data for a specific event via WebSocket.
 * @param {string|number} eventId - Unique identifier for the market event.
 * @returns {Object} Live data, connection status, and latest timestamp.
 */
export const useEventOrderbookData = (eventId) => {
  const [orderbookData, setOrderbookData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const wsUrl = `${WS_BASE_URL}/ws/orderbook/${eventId}/`;
  const { connectionStatus, lastMessage } = useWebSocket(wsUrl);

  useEffect(() => {
    if (lastMessage?.type === 'orderbook_snapshot') {
      setOrderbookData(lastMessage);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [lastMessage]);

  return {
    orderbookData,
    connectionStatus,
    lastUpdated,
    bestAsk: orderbookData?.asks?.length > 0
      ? Math.min(...orderbookData.asks.map(a => a.price))
      : null
  };
};