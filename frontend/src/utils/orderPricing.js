/**
 * Calculates the explicit Yes and No display prices for the UI buttons.
 * @param {Object} selectedEvent
 * @param {Object} orderbookData
 * @param {string} tradeType
 * @returns {{yesPrice: string, noPrice: string}}
 */
export const getYesNoPrices = (selectedEvent, orderbookData, tradeType) => {
  if (!selectedEvent) return { yesPrice: '50c', noPrice: '50c' };

  if (selectedEvent.eventId && orderbookData?.[selectedEvent.eventId]) {
    const data = orderbookData[selectedEvent.eventId];
    if (data.bestBid !== undefined && data.bestAsk !== undefined) {
      const yesPrice = tradeType === 'buy' ? data.bestAsk : data.bestBid;
      const noPrice = tradeType === 'buy' ? 1 - data.bestBid : 1 - data.bestAsk;
      return { yesPrice: `${(yesPrice * 100).toFixed(1)}c`, noPrice: `${(noPrice * 100).toFixed(1)}c` };
    }
  }

  if (selectedEvent.price) {
    const match = selectedEvent.price.match(/(\d+)/);
    if (match) {
      const yesCents = parseInt(match[1], 10);
      return { yesPrice: `${yesCents}c`, noPrice: `${100 - yesCents}c` };
    }
  }

  return { yesPrice: '50c', noPrice: '50c' };
};

/**
 * Determines the precise float limit price based on orderbook bid/ask spreads.
 * @param {string} choice
 * @param {Object} selectedEvent
 * @param {Object} orderbookData
 * @param {string} tradeType
 * @returns {number|null}
 */
export const determineLimitPrice = (choice, selectedEvent, orderbookData, tradeType) => {
  if (!selectedEvent) return null;

  if (selectedEvent.eventId && orderbookData?.[selectedEvent.eventId]) {
    const ob = orderbookData[selectedEvent.eventId];
    if (ob.bestBid != null && ob.bestAsk != null) {
      if (choice === 'yes') return tradeType === 'buy' ? ob.bestAsk : ob.bestBid;
      return tradeType === 'buy' ? 1 - ob.bestBid : 1 - ob.bestAsk;
    }
  }

  if (selectedEvent.price) {
    const match = selectedEvent.price.match(/(\d+)/);
    if (match) {
      const yesCents = parseInt(match[1], 10);
      return choice === 'yes' ? yesCents / 100 : (100 - yesCents) / 100;
    }
  }

  return null;
};