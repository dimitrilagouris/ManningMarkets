import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthContext } from '../session_management/authentication_context';

import './header.css';
import '../base.css';

function Header() {
    const {isAuthenticated, user} = useContext(AuthContext)
    const [query, setQuery] = useState('');
    const navigate = useNavigate();

    const isAdmin = isAuthenticated && user && user.is_admin;

    function handleSubmit(e) {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) {
            // if empty, go to markets root or home
            navigate('/markets');
            return;
        }
        // navigate to markets listing with a search param
        navigate(`/markets?search=${encodeURIComponent(trimmed)}`);
    }

    return (
        <header className="site-header" role="banner">
            <div className="site-header__inner">
                <Link to={isAuthenticated ? "/" : "/sign-up"} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="site-header__brand brand">
                        <div className="brand__title">Manning Markets</div>
                        <div className="brand__subtitle">Celebrating 175 years</div>
                    </div>
                </Link>

                <form className="site-header__search search" role="search" onSubmit={handleSubmit}>
                    <input
                        className="search__input"
                        type="search"
                        placeholder="Enter keywords to find a market e.g timetables"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Search markets"
                    />
                    <button className="search__submit" type="submit" aria-label="Search">
                        <span className="iconify" data-icon="ri:search-line" data-inline="false"></span>
                    </button>
                </form>

                <div className="site-header__right">
                    <nav className="main-nav" role="navigation" aria-label="Main navigation">
                        <ul className="main-nav__list">
                            {isAdmin && (
                                <li className="main-nav__item">
                                    <Link to='/admin' className="main-nav__link">Admin Dashboard</Link>
                                </li>
                            )}
                            {isAdmin && (
                                <li className="main-nav__item">
                                    <Link className="main-nav__link">Market Management</Link>
                                </li>
                            )}
                            <li className="main-nav__item">
                                <Link className="main-nav__link" to={isAuthenticated ? "/leaderboard" : "/login"}>Leaderboard</Link>
                            </li>
                            <li className="main-nav__item">
                                <Link className="main-nav__link" to={isAuthenticated ? "/wallet" : "/login"}>Wallet</Link>
                            </li>
                        </ul>
                    </nav>
                    <Link className="user-button" to={isAuthenticated ? "/profile" : "/login"} aria-label="Account">
                        <FontAwesomeIcon icon={faUser} />
                    </Link>
                </div>
            </div>
        </header>
    );
}

export default Header;
