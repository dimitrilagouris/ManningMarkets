import React, {useEffect, useState} from "react";

import './leaderboard.css';
import '../base.css'


import { DJANGO_API_BASE } from "../config";


function Leaderboard() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetch_leaderboard = async () => {
                try {
                const res = await fetch(`${DJANGO_API_BASE}/fetch_leaderboard/`, {
                    method: "GET",
                    credentials: "include",
                    headers: {'X-Requested-With': 'XMLHttpRequest'},
                });

                if (!res.ok){
                        throw new Error("Failed to fetch leaderboard");
                }

                const data = await res.json();
                setLeaderboardData(data.markets || []);
            }
            catch(err) {
                setError(err);
            }
            finally {
                setLoading(false);
            }
        }

        fetch_leaderboard();
    }, []);

    if (loading) {
        return <main className="main-content"> <div>Loading leaderboard... </div> </main>
    }

    if (error) {
        return <main className="main-content"> <div>Error Loading leaderboard: {error.message} </div> </main>
    }

    return (
        <div className="leaderboard-page">
            <div className="leaderboard-main-content">
            <div className="leaderboard-container">
                {/* leaderboard list */}
                <section className="leaderboard-overview-section" aria-labelledby="leaderboard-overview-heading">
                <div className="leaderboard-info" aria-labelledby="leaderboard-overview-heading">
                    <div className="leaderboard-section-header">leaderboard overview</div>
                    <h1 id="leaderboard-overview-heading" className="leaderboard-section-title">Leaderboard</h1>
                    <p className="leaderboard-description">
                    View a ranking of users that have accurately predicted the Manning Market.
                    </p>

                    <div className="leaderboard-list">
                        <div className="leaderboard-item">
                            <div className="leaderboard-first-label">Username</div>
                            <div className="leaderboard-first-label">Balance</div>
                        </div>

                        {leaderboardData.map((entry, index) => (
                            <div key={entry.username || index} className="leaderboard-item">
                                <div className="leaderboard-label">{index + 1}. {entry.username}</div>
                                <div className="leaderboard-value">{entry.balance}</div>
                            </div>
                        ))}
                    </div>
                </div>
                </section>
            </div>
            </div>
        </div>
    );
}

export default Leaderboard;