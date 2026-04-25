import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a ranked list of users and their balances.
 * @param {Object} props
 * @param {Array} props.data - Array of leaderboard entries.
 * @returns {JSX.Element}
 */
export const LeaderboardTable = ({ data }) => (
    <div className="leaderboard-list">
        <div className="leaderboard-item">
            <div className="leaderboard-first-label">Username</div>
            <div className="leaderboard-first-label">Balance</div>
        </div>

        {data.map((entry, index) => (
            <div key={entry.username || index} className="leaderboard-item">
                <div className="leaderboard-label">{index + 1}. {entry.username}</div>
                <div className="leaderboard-value">{entry.balance}</div>
            </div>
        ))}
    </div>
);

LeaderboardTable.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        username: PropTypes.string.isRequired,
        balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })).isRequired,
};