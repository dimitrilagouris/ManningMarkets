import React, {useState, useEffect} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faCalendarAlt, faUsers, faDollarSign, faCheck } from '@fortawesome/free-solid-svg-icons';


import './marketManagement.css';
const DJANGO_API_BASE = process.env.REACT_APP_DJANGO_API_BASE || 'http://localhost:8000';

function MarketManagement() {

    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(false);

    const [marketName, setMarketName] = useState('');
    const [marketExpirationDate, setMarketExpirationDate] = useState('');
    const [events, setEvents] = useState([{name: ''}]);

    const [activeTab, setActiveTab] = useState('create'); // 'create' or 'settle'
    const [actionLoading, setActionLoading] = useState(false);

    // admin_views -> get_markets_overview
    const fetchMarkets = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${DJANGO_API_BASE}/api/admin/markets/`, {
                credentials: 'include',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON but got:', text.substring(0, 200));
                throw new Error('Server returned non-JSON response');
            }
            
            const data = await response.json();
            console.log('Markets response:', data);
            
            // Handle the response format from get_markets_overview
            if (Array.isArray(data)) {
                setMarkets(data);
            } else if (data.markets && Array.isArray(data.markets)) {
                setMarkets(data.markets);
            } else {
                console.warn('Unexpected data format:', data);
                setMarkets([]);
            }
        } catch (error) {
            console.error('Error fetching markets:', error);
            setMarkets([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMarkets();
    }, []);

    // Get CSRF token
    const getCSRFToken = async () => {
        try {
            const response = await fetch(`${DJANGO_API_BASE}/get-csrf-token/`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.csrfToken;
            }
            return null;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            return null;
        }
    };

    const addEvent = () => {
        setEvents([...events, { name: '' }]);
    };

    const removeEvent = (index) => {
        if (events.length > 1) {
        setEvents(events.filter((_, i) => i !== index));
        }
    };

    const updateEvent = (index, field, value) => {
        const updatedEvents = [...events];
        updatedEvents[index][field] = value;
        setEvents(updatedEvents);
    };

    const handleCreateMarket = async () => {
        if (!marketName.trim()) {
            alert('Please enter a market name');
            return;
        }

        if (!marketExpirationDate) {
            alert('Please enter an expiration date for the market');
            return;
        }

        const validEvents = events.filter(event => 
            event.name.trim()
        );

        if (validEvents.length === 0) {
            alert('Please add at least one event with a name');
            return;
        }

        setActionLoading(true);
        try {
            const csrfToken = await getCSRFToken();
            const res = await fetch(`${DJANGO_API_BASE}/api/admin/create-market/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({
                market_name: marketName,
                expiration_date: marketExpirationDate,
                events: validEvents
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert('Market created successfully!');
                setMarketName('');
                setMarketExpirationDate('');
                setEvents([{ name: '' }]);
                fetchMarkets();
            } else {
                alert(data.error || 'Failed to create market');
            }
        } catch (err) {
            console.error('Error creating market:', err);
            alert('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSettleEvent = async (eventId, outcome) => {
        if (!window.confirm(`Are you sure you want to settle this event with ${outcome} as the winning outcome? This action cannot be undone!`)) {
            return;
        }
        
        setActionLoading(true);
        try {
            const csrfToken = await getCSRFToken();
            const res = await fetch(`${DJANGO_API_BASE}/api/admin/settle-market/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({ 
                    event_id: eventId, 
                    winning_outcome: outcome 
                }),
            });

            const data = await res.json();

            if (res.ok) {
                let message = `Event settled successfully!\nWinners: ${data.winners.length}\nLosers: ${data.losers.length}\nTotal payout: $${data.total_payout}`;
                if (data.cancelled_orders) {
                    message += `\nCancelled orders: ${data.cancelled_orders}`;
                }
                if (data.market_closed) {
                    message += '\n\nMarket has been closed as all events are now settled.';
                }
                alert(message);
                fetchMarkets();
            } else {
                alert(data.error || 'Failed to settle event');
            }
        } catch (err) {
            console.error('Error settling event:', err);
            alert('An error occurred');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <div className="marketManagement-page">
                <main className="marketManagement-content">
                <div className="marketManagement-container">
                    {/* Header */}
                    <div className="marketManagement-container__header">
                        <h1 className="marketManagement-container__title">Market Management Dashboard</h1>
                        <p className="marketManagement-container__subtitle">Create new markets and settle completed events</p>
                    </div>


                    {/* Toggle buttons */}
                    <div className="market-management__tabs">
                        <button
                            className={`market-management__tab ${activeTab === 'create' ? 'market-management__tab--active' : ''}`}
                            onClick={() => setActiveTab('create')}
                        >
                            Create Market
                        </button>
                        <button
                            className={`market-management__tab ${activeTab === 'settle' ? 'market-management__tab--active' : ''}`}
                            onClick={() => setActiveTab('settle')}
                        >
                            Settle Markets
                        </button>
                    </div>

                    {/* Create Markets */}
                    {activeTab === 'create' && (
                        <div className="market-management__content">
                            <div className="market-creation">
                                <h2 className="market-creation__title">Create New Market</h2>
                                
                                <div className="market-creation__form">
                                <div className="form-group">
                                    <label htmlFor="marketName" className="form-label">Market Name</label>
                                    <input
                                    type="text"
                                    id="marketName"
                                    className="form-input"
                                    value={marketName}
                                    onChange={(e) => setMarketName(e.target.value)}
                                    placeholder="Enter market name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="marketExpirationDate" className="form-label">Market Expiration Date</label>
                                    <input
                                    type="datetime-local"
                                    id="marketExpirationDate"
                                    className="form-input"
                                    value={marketExpirationDate}
                                    onChange={(e) => setMarketExpirationDate(e.target.value)}
                                    />
                                </div>

                                <div className="events-section">
                                    <h3 className="events-section__title">Events</h3>
                                    {events.map((event, index) => (
                                    <div key={index} className="event-form">
                                        <div className="event-form__header">
                                        <h4>Event {index + 1}</h4>
                                        {events.length > 1 && (
                                            <button
                                            type="button"
                                            className="remove-event-btn"
                                            onClick={() => removeEvent(index)}
                                            >
                                            <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        )}
                                        </div>
                                        
                                        <div className="form-group">
                                            <label className="form-label">Event Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={event.name}
                                                onChange={(e) => updateEvent(index, 'name', e.target.value)}
                                                placeholder="Enter event name"
                                            />
                                        </div>
                                    </div>
                                    ))}
                                    
                                    <button
                                    type="button"
                                    className="add-event-btn"
                                    onClick={addEvent}
                                    >
                                    <FontAwesomeIcon icon={faPlus} /> Add Another Event
                                    </button>
                                </div>

                                <button
                                    className="create-market-btn"
                                    onClick={handleCreateMarket}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Creating...' : 'Create Market'}
                                </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settle Markets */}
                    {activeTab === 'settle' && (
                        <div className="market-management__content">
                            <div className="market-settlement">
                                <h2 className="market-settlement__title">Settle Markets</h2>
                                
                                {loading ? (
                                    <div className="loading">Loading markets...</div>
                                ) : (
                                <div className="markets-list">
                                    {(markets || []).map(market => (
                                    <div key={market.id} className="market-card">
                                        <div className="market-card__header">
                                        <h3 className="market-card__title">{market.market_name}</h3>
                                        <span className={`market-status market-status--${market.status}`}>
                                            {market.status}
                                        </span>
                                        </div>
                                        
                                        <div className="market-card__events">
                                        {market.events && market.events.map(event => (
                                            <div key={event.id} className="event-card">
                                            <div className="event-card__info">
                                                <h4 className="event-card__name">{event.event_name}</h4>
                                                <div className="event-card__details">
                                                <span className="event-detail">
                                                    <FontAwesomeIcon icon={faCalendarAlt} />
                                                    {new Date(event.expiration_date).toLocaleDateString()}
                                                </span>
                                                <span className="event-detail">
                                                    <FontAwesomeIcon icon={faUsers} />
                                                    {event.participants || 0} participants
                                                </span>
                                                </div>
                                            </div>
                                            
                                            <div className="event-card__actions">
                                                {event.settled ? (
                                                <div className="settled-info">
                                                    <span className="settled-badge">
                                                    Settled: {event.winning_outcome}
                                                    </span>
                                                    <span className="settled-date">
                                                    {new Date(event.settled_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                ) : (
                                                <div className="settlement-buttons">
                                                    <button
                                                        className="settle-btn settle-btn--yes"
                                                        onClick={() => handleSettleEvent(event.id, 'YES')}
                                                        disabled={actionLoading}
                                                    >
                                                    <FontAwesomeIcon icon={faCheck} /> Settle YES
                                                    </button>
                                                    <button
                                                        className="settle-btn settle-btn--no"
                                                        onClick={() => handleSettleEvent(event.id, 'NO')}
                                                        disabled={actionLoading}
                                                    >
                                                    <FontAwesomeIcon icon={faTimes} /> Settle NO
                                                    </button>
                                                </div>
                                                )}
                                            </div>
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
                </main>
            </div>
        </>
    )

}

export default MarketManagement;
