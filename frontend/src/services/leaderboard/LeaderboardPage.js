import React, { useEffect, useState } from "react";
import { DJANGO_API_BASE } from "../../config";
import { LeaderboardTable } from "../../components/tables/leaderboard/LeaderboardTable";

import '../wallet/WalletPage.css';
import '../../components/tables/leaderboard/leaderboard.css';
import '../../styles/base.css';

/**
 * Main container for the leaderboard page.
 * Combines wallet layout structure with specific leaderboard table styles.
 * @returns {React.JSX.Element}
 */
function LeaderboardPage() {
    /** @type {[Array<Object>, function(Array<Object>): void]} */
    const [leaderboardData, setLeaderboardData] = useState([]);

    /** @type {[boolean, function(boolean): void]} */
    const [loading, setLoading] = useState(true);

    /** @type {[Error|null, function(Error|null): void]} */
    const [error, setError] = useState(null);

    useEffect(() => {
        /**
         * Fetches current market leaders from the backend.
         */
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch(`${DJANGO_API_BASE}/fetch_leaderboard/`, {
                    method: "GET",
                    credentials: "include",
                    headers: { 'X-Requested-With': 'XMLHttpRequest' },
                });

                if (!res.ok) throw new Error("Failed to fetch leaderboard");

                const data = await res.json();
                setLeaderboardData(data.markets || []);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) return <main className="main-content"><div>Loading leaderboard...</div></main>;
    if (error) return <main className="main-content"><div>Error Loading leaderboard: {error.message}</div></main>;

    return (
        <div className="wallet-page">
            <div className="wallet-main-content">
                <div className="wallet-container">
                    <section className="wallet-overview-section">
                        <div className="wallet-balance-info">
                            <div className="wallet-section-header">Community rankings</div>
                            <h1 id="wallet-overview-heading" className="wallet-section-title">Leaderboard</h1>
                            <p className="wallet-description">
                                View a ranking of users that have accurately predicted the Manning Market.
                            </p>

                            <LeaderboardTable data={leaderboardData} />

                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

export default LeaderboardPage;