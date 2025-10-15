import React, { useState } from "react";
import './placePosition.css';
import '../base.css';

export const MarketEventsTable = ({ events = [], onSelectEvent }) => {
  return (
    <div className="market-events">
      <table className="market-events__table" role="table">
        <thead>
          <tr>
            <th className="market-events__th">Outcome</th>
            <th className="market-events__th">Chance</th>
            <th className="market-events__th">Yes / No</th>
          </tr>
        </thead>

        <tbody>
          {events.map((ev, i) => (
            <tr className="market-events__tr" key={i}>
              <td className="market-events__td market-events__outcome">
                <div className="market-events__outcome-name">{ev.outcomeName}</div>
                <div className="market-events__outcome-price">{ev.price}</div>
              </td>

              <td className="market-events__td market-events__chance">
                {ev.chance}
              </td>

              <td className="market-events__td market-events__actions">
                <button
                  type="button"
                  className="place-position__choice-button place-position__choice-button--yes market-events__btn"
                  onClick={() => onSelectEvent(ev, 'yes')}
                >
                  Yes
                </button>

                <button
                  type="button"
                  className="place-position__choice-button place-position__choice-button--no market-events__btn"
                  onClick={() => onSelectEvent(ev, 'no')}
                >
                  No
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const PlacePositionPage = () => {
  const [amount, setAmount] = useState('');
  const [tradeType, setTradeType] = useState('buy'); // 'buy' or 'sell'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedChoice, setSelectedChoice] = useState(null); // 'yes' or 'no'

  // sample events - in real usage pass from parent / fetch from API
  const sampleEvents = [
    { outcomeName: 'Event A', price: '50c', chance: '50%', volume: 1200 },
    { outcomeName: 'Event B', price: '30c', chance: '30%', volume: 400 },
    { outcomeName: 'Event C', price: '20c', chance: '20%', volume: 150 },
  ];

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

  const toggleTradeType = () => {
    setTradeType(prev => prev === 'buy' ? 'sell' : 'buy');
  };

  const handleSelectEvent = (event, choice) => {
    setSelectedEvent(event);
    setSelectedChoice(choice);
  };

  const handleChoiceButtonClick = (choice) => {
    setSelectedChoice(choice);
  };

  return (
    <div className="place-position">
      <div className="place-position__left">
        <div className="place-position__left-content">
          <div className="place-position__title place-position__title--market">Market Name Goes Here</div>
          <div className="place-position__subtitle">$423,015.31</div>
          <div className="place-position__timestamp">Oct 14, 2025</div>

          {/* Market events table component — pass events here */}
          <MarketEventsTable events={sampleEvents} onSelectEvent={handleSelectEvent} />
        </div>
      </div>

      <div className="place-position__right">
        <div className="place-position__right-header">
          <div className="place-position__title place-position__title--position">
            {selectedEvent ? selectedEvent.outcomeName : 'Position Name Goes Here'}
          </div>

          <button className="place-position__button--buy-sell" onClick={toggleTradeType}>
            <span className="place-position__subtitle">
              {tradeType === 'buy' ? 'Buy' : 'Sell'}
            </span>
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
            <button
              className={`place-position__choice-button place-position__choice-button--yes ${selectedChoice === 'yes' ? 'place-position__choice-button--selected' : ''}`}
              onClick={() => handleChoiceButtonClick('yes')}
            >
              Yes {selectedEvent ? selectedEvent.price : '50c'}
            </button>

            <button
              className={`place-position__choice-button place-position__choice-button--no ${selectedChoice === 'no' ? 'place-position__choice-button--selected' : ''}`}
              onClick={() => handleChoiceButtonClick('no')}
            >
              No {selectedEvent ? selectedEvent.price : '50c'}
            </button>
          </div>

          <div className="place-position__amount">
            <div className="place-position__subtitle">Amount</div>

            <div className="place-position__balance">
              <div className="place-position__balance-text">Balance $0.00</div>
            </div>
          </div>

          <div className="place-position__input">
            <button
              className="place-position__input-button"
              aria-label="Decrease amount"
              onClick={handleDecrease}
            >
              <span className="iconify" data-icon="ri:subtract-line" data-inline="false"></span>
            </button>

            {/* centred currency + input wrapper */}
            <label className="place-position__input-field" aria-hidden="false">
              <div className="place-position__input-center">
                <span className="place-position__currency">$</span>
                <input
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleInputChange}
                  aria-label="Enter amount"
                />
              </div>
            </label>

            <button
              className="place-position__input-button"
              aria-label="Increase amount"
              onClick={handleIncrease}
            >
              <span className="iconify" data-icon="ri:add-large-fill" data-inline="false"></span>
            </button>
          </div>

          <button className="place-position__button--buy">
            {tradeType === 'buy' ? 'Buy' : 'Sell'}
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