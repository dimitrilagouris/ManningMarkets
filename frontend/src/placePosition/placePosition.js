import React, { useState } from "react";
import './placePosition.css';
import '../base.css';

export const PlacePositionPage = () => {
  const [amount, setAmount] = useState('');

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleIncrease = () => {
    const num = amount ? parseFloat(amount) : 0;
    setAmount((num + 1).toFixed(2));
  };

  const handleDecrease = () => {
    const num = amount ? parseFloat(amount) : 0;
    setAmount(Math.max(0, num - 1).toFixed(2));
  };

  return (
    <div className="place-position">
      <div className="place-position__left">
        <div className="place-position__left-content">
          <div className="place-position__title place-position__title--market">Market Name Goes Here</div>
          <div className="place-position__subtitle">$423,015.31</div>
          <div className="place-position__timestamp">Oct 14, 2025</div>
        </div>
      </div>

      <div className="place-position__right">
      <div className="place-position__right-header">
          <div className="place-position__title place-position__title--position">Position Name Goes Here</div>

          <button className="place-position__button--buy-sell">
            <span className="place-position__subtitle">Buy</span>
            <div className="place-position__icon">
              <span className="iconify" data-icon="mdi:chevron-down" data-inline="false"></span>
            </div>
          </button>
        </div>

        <div className="place-position__info-container">
          <div className="place-position__outcome">
            <div className="place-position__subtitle">Outcome</div>
            <div className="place-position__icon">
              <span className="iconify" data-icon="ri:information-2-line" data-inline="false"></span>
            </div>
          </div>

          <div className="place-position__choice-buttons">
            <button className="place-position__choice-button place-position__choice-button--yes">
              Yes 50c
            </button>

            <button className="place-position__choice-button place-position__choice-button--no">
              No 50c
            </button>
          </div>

          <div className="place-position__amount">
            <div className="place-position__subtitle">Amount</div>

            <div className="place-position__balance">
              <div className="place-position__balance-text">Balance $0.00</div>
            </div>
          </div>

          <div className="place-position__input">
            <button className="place-position__input-button" aria-label="Decrease amount" onClick={handleDecrease}>
              <span className="iconify" data-icon="ri:subtract-line" data-inline="false"></span>
            </button>

            <label className="place-position__input-field">
              <input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={handleInputChange}
                aria-label="Enter amount"
              />
            </label>

            <button className="place-position__input-button" aria-label="Increase amount" onClick={handleIncrease}>
              <span className="iconify" data-icon="ri:add-large-fill" data-inline="false"></span>
            </button>
          </div>

          <button className="place-position__button--buy">
            Buy
          </button>

          <div className="place-position__stat-row place-position__stat-row--avg-price">
            <div className="place-position__stat-label">Avg Price</div>
            <div className="place-position__stat-value">0¢</div>
          </div>

          <div className="place-position__stat-row place-position__stat-row--shares">
            <div className="place-position__stat-label">Shares</div>
            <div className="place-position__stat-label">0¢</div>
          </div>

          <div className="place-position__stat-row place-position__stat-row--return">
            <div className="place-position__stat-label">Potential Return</div>
            <div className="place-position__stat-value place-position__stat-value--positive">$00.00 (0.00%)</div>
          </div>
        </div>
      </div>
    </div>
  );
};