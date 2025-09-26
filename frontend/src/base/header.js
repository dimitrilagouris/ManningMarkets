// Header.jsx
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass, faUser } from '@fortawesome/free-solid-svg-icons'
import React from 'react';

import './header.css';
import '../base.css';

function Header() {
  return (
      <header className="site-header" role="banner">
          <div className="site-header__inner">

              <div className="site-header__brand brand">
                  <div className="brand__title">Manning Markets</div>
                  <div className="brand__subtitle">Celebrating 175 years</div>
              </div>

              <form className="site-header__search search" role="search">
                  <input className="search__input" type="search"
                         placeholder="Enter keywords to find a market e.g timetables"/>
                  <button className="search__submit" type="submit" aria-label="Search">
                      <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
              </form>

              <div className="site-header__right">
                  <nav className="main-nav" role="navigation" aria-label="Main navigation">
                      <ul className="main-nav__list">
                          <li className="main-nav__item">
                              <button className="main-nav__link" type="button">Markets</button>
                          </li>
                          <li className="main-nav__item">
                              <button className="main-nav__link" type="button">Wallet</button>
                          </li>
                      </ul>
                  </nav>

                  <button className="user-button" type="button" aria-label="Account">
                    <FontAwesomeIcon icon={faUser} />
                  </button>
              </div>

          </div>
      </header>
  );
}

export default Header;
