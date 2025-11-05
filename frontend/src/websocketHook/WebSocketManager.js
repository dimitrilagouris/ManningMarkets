/**
 * Global WebSocket manager to prevent duplicate connections
 * Ensures only one WebSocket connection per event
 */

import { WS_BASE_URL } from '../config';

class WebSocketManager {
  constructor() {
    this.connections = new Map(); // eventId -> { ws, subscribers }
  }

  subscribe(eventId, callback) {
    const eventIdStr = eventId.toString();
    
    // Add callback to subscribers
    if (!this.connections.has(eventIdStr)) {
      this.connections.set(eventIdStr, { ws: null, subscribers: new Set() });
    }
    
    const connection = this.connections.get(eventIdStr);
    
    // Prevent duplicate callbacks
    if (connection.subscribers.has(callback)) {
      return () => this.unsubscribe(eventIdStr, callback);
    }
    
    connection.subscribers.add(callback);

    // Create WebSocket if it doesn't exist or is closed
    if (!connection.ws || connection.ws.readyState === WebSocket.CLOSED || connection.ws.readyState === WebSocket.CLOSING) {
      const wsUrl = `${WS_BASE_URL}/ws/orderbook/${eventId}/`;
      console.log(`[WS MANAGER] Creating SINGLE connection for event ${eventId}`);
      
      const ws = new WebSocket(wsUrl);
      connection.ws = ws;


      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Notify all subscribers
          connection.subscribers.forEach(callback => {
            try {
              callback(data);
            } catch (error) {
            }
          });
        } catch (error) {
        }
      };

      ws.onclose = () => {
        connection.ws = null;
      };

      ws.onerror = (error) => {
      };
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventIdStr, callback);
  }

  unsubscribe(eventId, callback) {
    const eventIdStr = eventId.toString();
    const connection = this.connections.get(eventIdStr);
    
    if (connection) {
      connection.subscribers.delete(callback);
      
      // Close WebSocket if no more subscribers
      if (connection.subscribers.size === 0 && connection.ws) {
        connection.ws.close();
        this.connections.delete(eventIdStr);
      }
    }
  }

  getConnectionStatus(eventId) {
    const connection = this.connections.get(eventId.toString());
    if (!connection || !connection.ws) return 'disconnected';
    if (connection.ws.readyState === WebSocket.OPEN) return 'connected';
    if (connection.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

// Global instance
const wsManager = new WebSocketManager();

export default wsManager;