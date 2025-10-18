import { useState, useEffect, useRef } from 'react';
import wsManager from './WebSocketManager';

export const useWebSocket = (url) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Extract eventId from URL (e.g., "ws://localhost:8000/ws/orderbook/123/" -> "123")
    const eventIdMatch = url.match(/\/ws\/orderbook\/(\d+)\//);
    if (!eventIdMatch) return;
    
    const eventId = eventIdMatch[1];

    // Create a unique callback for this hook instance
    const callback = (data) => {
      setLastMessage(data);
    };

    // Subscribe to the WebSocket manager
    const unsubscribe = wsManager.subscribe(eventId, callback);

    unsubscribeRef.current = unsubscribe;

    // Set initial connection status
    setConnectionStatus(wsManager.getConnectionStatus(eventId));

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(wsManager.getConnectionStatus(eventId));
    }, 1000);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      clearInterval(statusInterval);
    };
  }, [url]);

  return {
    connectionStatus,
    lastMessage,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isDisconnected: connectionStatus === 'disconnected',
  };
};
