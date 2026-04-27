import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthContext } from '../../auth-pages/authentication_context';
import { SearchBar } from '../forms/SearchBar';

import './header.css';
import '../../styles/base.css';

/**
 * Main site header containing branding, search, and primary navigation.
 * @returns {JSX.Element}
 */
function Header() {
    const { isAuthenticated, user } = useContext(AuthContext);
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    const isAdmin = isAuthenticated && user && user.is_admin;

    /**
     * Navigates to the markets page with the provided search query.
     * @param {string} searchQuery
     * @returns {void}
     */
    const handleSearch = (searchQuery) => {
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            navigate('/markets');
            return;
        }
        navigate(`/markets?search=${encodeURIComponent(trimmed)}`);
    };

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = () => setMenuOpen(false);

    return (
        <header className="site-header" role="banner">
            <div className="site-header__inner">
                <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="site-header__brand brand">
                        <div className="brand__title">Manning Markets</div>
                        <div className="brand__subtitle">Celebrating 175 years</div>
                    </div>
                </Link>

                <div className="site-header__search search">
                    <SearchBar
                        placeholderText="Enter keywords to find a market e.g timetables"
                        onSearch={handleSearch}
                    />
                </div>

                <div className="site-header__right">
                    <button
                        className="hamburger-button"
                        onClick={toggleMenu}
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                    >
                        <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
                    </button>

                    <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} role="navigation" aria-label="Main navigation">
                        <ul className="main-nav__list">
                            {isAdmin && (
                                <li className="main-nav__item">
                                    <Link className="main-nav__link" to="/admin" onClick={closeMenu}>Admin Dashboard</Link>
                                </li>
                            )}
                            {isAdmin && (
                                <li className="main-nav__item">
                                    <Link className="main-nav__link" to="/market-management" onClick={closeMenu}>Market Management</Link>
                                </li>
                            )}

                            <li className="main-nav__item">
                                <Link className="main-nav__link" to="/leaderboard" onClick={closeMenu}>Leaderboard</Link>
                            </li>

                            {isAuthenticated && (
                                <li className="main-nav__item">
                                    <Link className="main-nav__link" to="/wallet" onClick={closeMenu}>Wallet</Link>
                                </li>
                            )}
                            {isAuthenticated && (
                                <li className="main-nav__item main-nav__item--mobile-only">
                                    <Link className="main-nav__link" to="/profile" onClick={closeMenu}>Profile</Link>
                                </li>
                            )}

                            {!isAuthenticated && (
                                <li className="main-nav__item">
                                    <Link className="main-nav__link" to="/login" onClick={closeMenu}>Log In</Link>
                                </li>
                            )}
                        </ul>
                    </nav>
                    {isAuthenticated && (
                        <Link className="user-button" to="/profile" aria-label="Account">
                            <FontAwesomeIcon icon={faUser} />
                        </Link>
                    )}
                </div>
            </div>
            {menuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
        </header>
    );
}

export default Header;