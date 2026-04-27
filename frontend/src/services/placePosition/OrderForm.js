import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';

import { DJANGO_API_BASE } from '../../config';
import { getYesNoPrices, determineLimitPrice } from '../../utils/orderPricing';
import { Button } from '../../components/buttons/Button';
import { FormInput } from '../../components/forms/FormInput';
import { AlertCard } from '../../components/cards/AlertCard';

/**
 * Submits the user's market order to the backend API.
 * @param {Object} payload - The structured order details.
 * @returns {Promise<Object>} The API response data.
 */
async function postOrder(payload) {
  const res = await fetch(`${DJANGO_API_BASE}/api/orders/`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': Cookies.get('csrftoken') },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to submit order');
  }

  return res.json();
}

/**
 * Renders the bottom statistics rows, calculating returns for buys and sells.
 * @param {Object} props
 * @returns {React.JSX.Element}
 */
const OrderStats = ({ shares, amount, tradeType }) => {
  const sharesNum = parseInt(shares || '0', 10);
  const price = parseFloat(amount || '0');

  let returnDisplay = '$0.00';
  let isError = false;

  if (price > 1) {
    returnDisplay = 'Max price is $1.00';
    isError = true;
  } else if (sharesNum > 0 && price >= 0) {
    const potentialReturn = tradeType === 'buy' ? sharesNum * (1 - price) : sharesNum * price;
    returnDisplay = `$${potentialReturn.toFixed(2)}`;
  }

  return (
    <>
      <div className="place-position__stat-row place-position__stat-row--shares">
        <div className="place-position__stat-label">Shares</div>
        <div className="place-position__stat-label">{sharesNum}</div>
      </div>
      <div className="place-position__stat-row place-position__stat-row--return">
        <div className="place-position__stat-label">
          {tradeType === 'buy' ? 'Potential Profit' : 'Credits Received'}
        </div>
        <div className="place-position__stat-value place-position__stat-value--positive" style={isError ? { color: 'var(--usyd-red)' } : {}}>
          {returnDisplay}
        </div>
      </div>
    </>
  );
};

OrderStats.propTypes = {
  shares: PropTypes.string,
  amount: PropTypes.string,
  tradeType: PropTypes.string.isRequired,
};

/**
 * Renders the form for selecting shares, setting limits, and placing orders.
 * @param {Object} props
 * @returns {React.JSX.Element}
 */
export const OrderForm = ({ selectedEvent, initialChoice, walletBalance, eventOrderbookData, onOrderSuccess, isAuthenticated }) => {
  const [amount, setAmount] = useState('');
  const [shares, setShares] = useState('');
  const [tradeType, setTradeType] = useState('buy');
  const [selectedChoice, setSelectedChoice] = useState('yes');
  const [tradeDropdownOpen, setTradeDropdownOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState('');

  useEffect(() => {
    if (initialChoice) setSelectedChoice(initialChoice);
  }, [initialChoice, selectedEvent]);

  /** @param {string} choice */
  const handleChoiceClick = (choice) => {
    setSelectedChoice(choice);
    const limitPrice = determineLimitPrice(choice, selectedEvent, eventOrderbookData, tradeType);
    setAmount(typeof limitPrice === 'number' && !isNaN(limitPrice) ? Math.min(1, limitPrice).toFixed(2) : '');
  };

  const submitOrder = async () => {
    if (!isAuthenticated) return setOrderMessage('Please log in to place orders');
    if (!selectedEvent?.eventId || !selectedChoice || !amount || !shares) return setOrderMessage('Please fill in all required fields');

    const price = parseFloat(amount);
    const quantity = parseInt(shares, 10);

    if (tradeType === 'buy' && price * quantity > walletBalance) {
      return setOrderMessage(`Error: Insufficient balance. Cost: $${(price * quantity).toFixed(2)}, Available: $${walletBalance.toFixed(2)}`);
    }

    setSubmittingOrder(true);
    setOrderMessage('');

    try {
      await postOrder({
        event_id: selectedEvent.eventId,
        order_type: tradeType.toUpperCase(),
        share_type: selectedChoice.toUpperCase(),
        quantity,
        price
      });

      setOrderMessage('success');
      setAmount('');
      setShares('');
      if (onOrderSuccess) onOrderSuccess();
    } catch (err) {
      setOrderMessage(`Error: ${err.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const { yesPrice, noPrice } = getYesNoPrices(selectedEvent, eventOrderbookData, tradeType);

  return (
    <>
      <div className="place-position__right-header" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="place-position__title place-position__title--position">
          {selectedEvent?.outcomeName || 'Position Name Goes Here'}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button className={`trade-dropdown orderbook-btn ${tradeType} ${tradeDropdownOpen ? 'open' : ''}`} onClick={() => setTradeDropdownOpen(!tradeDropdownOpen)}>
            <span className="trade-dropdown-text">{tradeType === 'buy' ? 'Buy' : 'Sell'}</span>
            <span className="iconify trade-dropdown-icon" data-icon="ri:arrow-down-s-line" />
          </button>
          {tradeDropdownOpen && (
            <div className="trade-dropdown-menu" role="menu">
              <div className="trade-dropdown-item" onClick={() => { setTradeType('buy'); setTradeDropdownOpen(false); }}>Buy</div>
              <div className="trade-dropdown-item" onClick={() => { setTradeType('sell'); setTradeDropdownOpen(false); }}>Sell</div>
            </div>
          )}
        </div>
      </div>

      <div className="place-position__info-container">
        <div className="place-position__outcome">
          <div className="place-position__subtitle">Outcome</div>
          <div className="place-position__icon">
            <span className="iconify" data-icon="ri:information-2-line" />
          </div>
        </div>

        <div className="place-position__choice-buttons" style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <Button
            isSelectable={true}
            isSelected={selectedChoice === 'yes'}
            fill="light"
            width="full"
            onClick={() => handleChoiceClick('yes')}
          >
            Yes {yesPrice}
          </Button>
          <Button
            isSelectable={true}
            isSelected={selectedChoice === 'no'}
            fill="light"
            width="full"
            onClick={() => handleChoiceClick('no')}
          >
            No {noPrice}
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <FormInput
            type="number"
            label="Limit Price"
            fill="white"
            placeholder="0.00"
            value={amount}
            min="0"
            max="1"
            step="0.01"
            fullWidth
            onChange={(e) => {
              const val = e.target.value;

              if (val === '' || val === '.') {
                setAmount(val);
              } else if (/^\d*\.?\d{0,2}$/.test(val) && parseFloat(val) <= 1) {
                setAmount(val);
              }
            }}
          />

          <FormInput
            type="number"
            label="Shares"
            placeholder="0"
            value={shares}
            fill="white"
            min="0"
            step="1"
            fullWidth
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d+$/.test(val)) {
                setShares(val);
              }
            }}
          />
        </div>

        <Button
          fill="primary"
          width="full"
          height="large"
          disabled={submittingOrder}
          onClick={submitOrder}
        >
          {submittingOrder ? 'Submitting...' : tradeType === 'buy' ? 'Buy' : 'Sell'}
        </Button>

        {/* Display the new AlertCard on success, or standard error string if it fails */}
        {orderMessage && (
          <div style={{ marginTop: '16px' }}>
            {orderMessage === 'success' ? (
              <AlertCard
                title="Order Submitted"
                type="success"
                description={
                  <p>
                    Your order was successfully placed on the market. You can view your active positions and track live orders by visiting your <strong>Wallet</strong>.
                  </p>
                }
              />
            ) : (
              <div className="order-message error">{orderMessage}</div>
            )}
          </div>
        )}

        <OrderStats shares={shares} amount={amount} tradeType={tradeType} />
      </div>
    </>
  );
};

OrderForm.propTypes = {
  selectedEvent: PropTypes.object,
  initialChoice: PropTypes.string,
  walletBalance: PropTypes.number.isRequired,
  eventOrderbookData: PropTypes.object.isRequired,
  onOrderSuccess: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool.isRequired,
};