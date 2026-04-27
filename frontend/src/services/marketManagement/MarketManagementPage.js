import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { fetchAdminData, getCSRFToken } from '../../api/adminApi';
import { DJANGO_API_BASE } from '../../config';
import { FormInput } from '../../components/forms/FormInput';
import { Button } from '../../components/buttons/Button';
import { SettleMarketsList } from '../../components/cards/MarketCard';
import Loading from "../../components/common/Loading";

import './MarketManagementPage.css';
import '../../styles/base.css';

/**
 * @typedef {Object} PredictionEvent
 * @property {string} name
 */

/**
 * @typedef {Object} MarketPayload
 * @property {string} market_name
 * @property {string} expiration_date
 * @property {PredictionEvent[]} events
 */

/**
 * Executes a state-modifying administrative POST request.
 * @param {string} endpoint - The target API endpoint suffix.
 * @param {Object} payload - The JSON payload to transmit.
 * @returns {Promise<Object>}
 */
const postAdminAction = async (endpoint, payload) => {
    const token = await getCSRFToken();
    const res = await fetch(`${DJANGO_API_BASE}/api/admin/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': token },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
        const error = new Error(data.error || 'Action failed');
        error.status = res.status;
        throw error;
    }
    return data;
};

/**
 * Renders an individual input row for a prediction event.
 * @param {Object} props - Component properties.
 */
const EventRow = ({ index, value, onChange, onRemove, canRemove, isNew = false }) => {
    /** @type {React.RefObject<HTMLInputElement>} */
    const inputRef = useRef(null);

    useEffect(() => {
        if (isNew && inputRef.current) inputRef.current.focus();
    }, [isNew]);

    const removeIcon = (
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" width="12" height="12">
            <line x1="1" y1="1" x2="13" y2="13" strokeWidth="2.5" />
            <line x1="13" y1="1" x2="1" y2="13" strokeWidth="2.5" />
        </svg>
    );

    return (
        <div className={`event-row${isNew ? ' event-row--new' : ''}`}>
            <span className="event-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
            </span>
            <div className="event-input-wrapper">
                <input
                    ref={inputRef}
                    className="event-input"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(index, e.target.value)}
                    placeholder={`e.g. "Team A wins the final"`}
                    aria-label={`Event ${index + 1}`}
                />
                <span className="event-input-underline" aria-hidden="true" />
            </div>
            {canRemove ? (
                <div className="event-remove-action">
                    <Button fill="none" outline="none" textColor="dark" onClick={() => onRemove(index)} icon={removeIcon} aria-label={`Remove event ${index + 1}`} />
                </div>
            ) : (
                <div className="event-remove-placeholder" aria-hidden="true" />
            )}
        </div>
    );
};

EventRow.propTypes = {
    index: PropTypes.number.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    canRemove: PropTypes.bool.isRequired,
    isNew: PropTypes.bool,
};

/**
 * Manages the list of prediction events for a new market.
 * @param {Object} props - Component properties.
 */
export const EventsSection = ({ events, onAdd, onRemove, onUpdate }) => {
    /** @type {[number|null, React.Dispatch<React.SetStateAction<number|null>>]} */
    const [newestIndex, setNewestIndex] = useState(null);

    const handleAdd = () => {
        onAdd();
        setNewestIndex(events.length);
    };

    // Auto-clears the new row focus state to prevent layout jumps on subsequent edits
    useEffect(() => {
        if (newestIndex === null) return;
        const timer = setTimeout(() => setNewestIndex(null), 300);
        return () => clearTimeout(timer);
    }, [newestIndex]);

    const validCount = events.filter(e => e.name.trim()).length;
    const addIcon = (
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" width="14" height="14">
            <line x1="7" y1="1" x2="7" y2="13" strokeWidth="2" />
            <line x1="1" y1="7" x2="13" y2="7" strokeWidth="2" />
        </svg>
    );

    return (
        <div className="events-section-usyd">
            <div className="events-header">
                <h3 className="events-header-label">Prediction Events</h3>
                <span className="events-count-badge">{validCount} / {events.length} filled</span>
            </div>
            <div className="events-list" role="list">
                {events.length === 0 ? (
                    <p className="events-empty">No events yet — add one below.</p>
                ) : (
                    events.map((event, index) => (
                        <EventRow
                            key={index}
                            index={index}
                            value={event.name}
                            onChange={onUpdate}
                            onRemove={onRemove}
                            canRemove={events.length > 1}
                            isNew={index === newestIndex}
                        />
                    ))
                )}
            </div>
            <div className="events-add-row">
                <Button outline="primary" fill="none" textColor="dark" icon={addIcon} onClick={handleAdd}>
                    Add Event
                </Button>
            </div>
        </div>
    );
};

EventsSection.propTypes = {
    events: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })).isRequired,
    onAdd: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onUpdate: PropTypes.func.isRequired,
};

/**
 * Form for defining and submitting a new prediction market.
 * @param {Object} props - Component properties.
 */
const CreateMarketForm = ({ actionLoading, onMarketCreate }) => {
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [marketName, setMarketName] = useState('');
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [marketExpirationDate, setMarketExpirationDate] = useState('');
    /** @type {[PredictionEvent[], React.Dispatch<React.SetStateAction<PredictionEvent[]>>]} */
    const [events, setEvents] = useState([{ name: '' }]);

    const addEvent = () => setEvents(prev => [...prev, { name: '' }]);
    const removeEvent = (idx) => events.length > 1 && setEvents(prev => prev.filter((_, i) => i !== idx));
    const updateEvent = (idx, val) => setEvents(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], name: val };
        return next;
    });

    const handleSubmit = async () => {
        if (!marketName.trim() || !marketExpirationDate) {
            return alert('Please provide a market name and expiration date.');
        }

        const validEvents = events.filter(e => e.name.trim());
        if (!validEvents.length) return alert('Please add at least one valid event.');

        await onMarketCreate({
            market_name: marketName,
            expiration_date: marketExpirationDate,
            events: validEvents,
        });

        setMarketName('');
        setMarketExpirationDate('');
        setEvents([{ name: '' }]);
    };

    return (
        <div className="create-market-form">
            <FormInput label="Market Name" value={marketName} onChange={(e) => setMarketName(e.target.value)} placeholder="Enter market name" fullWidth />
            <FormInput type="datetime-local" label="Market Expiration Date" value={marketExpirationDate} onChange={(e) => setMarketExpirationDate(e.target.value)} fullWidth />
            <EventsSection events={events} onAdd={addEvent} onRemove={removeEvent} onUpdate={updateEvent} />
            <Button fill="primary" width="full" height="medium" onClick={actionLoading ? undefined : handleSubmit}>
                {actionLoading ? 'Creating…' : 'Create Market'}
            </Button>
        </div>
    );
};

CreateMarketForm.propTypes = {
    actionLoading: PropTypes.bool.isRequired,
    onMarketCreate: PropTypes.func.isRequired,
};

/**
 * Main wrapper for administrative market creation and settlement.
 * @returns {JSX.Element}
 */
export default function MarketManagementPage() {
    /** @type {[Array, React.Dispatch<React.SetStateAction<Array>>]} */
    const [markets, setMarkets] = useState([]);
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(true);
    /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} */
    const [activeTab, setActiveTab] = useState('create');
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [actionLoading, setActionLoading] = useState(false);

    /**
     * Retrieves the latest active and pending markets.
     */
    const loadMarkets = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminData('markets/');
            setMarkets(Array.isArray(data) ? data : (data.markets || []));
            setLoading(false);
        } catch (err) {
            console.error("Failed to load markets", err);
            if (err.message.includes('401') || err.message.includes('403')) {
                window.location.replace('/login');
            }
        }
    };

    useEffect(() => {
        loadMarkets();
    }, []);

    /**
     * Transmits a new market configuration to the server.
     * @param {MarketPayload} payload - Formatted market data.
     */
    const handleCreateMarket = async (payload) => {
        setActionLoading(true);
        try {
            await postAdminAction('create-market/', payload);
            alert('Market created successfully!');
            await loadMarkets();
        } catch (err) {
            alert(err.message || 'Failed to create market');
        } finally {
            setActionLoading(false);
        }
    };

    /**
     * Finalises a market event by declaring the winning outcome.
     * @param {string|number} eventId - Target event identifier.
     * @param {string} outcome - The winning selection.
     */
    const handleSettleEvent = async (eventId, outcome) => {
        if (!window.confirm(`Settle this event with ${outcome} as the winner? This cannot be undone!`)) return;

        setActionLoading(true);
        try {
            const data = await postAdminAction('settle-market/', {
                event_id: eventId,
                winning_outcome: outcome
            });
            alert(`Event settled!\nTotal payout: $${data.total_payout}`);
            await loadMarkets();
        } catch (err) {
            alert(err.message || 'Failed to settle event');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
                <div className="wallet-container">
                    <section className="wallet-overview-section">
                        <div className="wallet-balance-info">
                            <div className="wallet-section-header">admin tools</div>
                            <h1 className="wallet-section-title">Market Management</h1>
                            <p className="wallet-description">
                                Create new markets, configure prediction events, and securely settle completed outcomes.
                            </p>
                        </div>
                    </section>

                    <section className="wallet-content-section">
                        <div className="wallet-tabs" role="tablist">
                            {['create', 'settle'].map(tab => (
                                <button
                                    key={tab}
                                    type="button"
                                    role="tab"
                                    className={`selection-tab ${activeTab === tab ? 'wallet-tab--active' : ''}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {tab === 'create' ? 'Create Market' : 'Settle Market'}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'create' && <CreateMarketForm actionLoading={actionLoading} onMarketCreate={handleCreateMarket} />}
                        {activeTab === 'settle' && <SettleMarketsList markets={markets} loading={loading} actionLoading={actionLoading} onSettleEvent={handleSettleEvent} />}
                    </section>
                </div>
            </div>
        </div>
    );
}