// User.jsx
import React from 'react';
import './user.css';
import '../base.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faLock, 
  faWallet, 
  faFlag,
  faArrowRight,
  faRotateRight,
  faTrash
} from '@fortawesome/free-solid-svg-icons';


function User() {
  // Placeholders, need to add logic
  const joinedDate = 'December 25, 2000';
  const userName = 'Alex Vaughan';
  const userId = 'User ID: 1';


  return (
    <>
      <div className="user-page">
        <main className="user-content">
          <div className="user-container">
            <div className="user-container__header">
              <h1 className="user-container__title">Account Information</h1>
              <p className="user-container__username">{userName}</p>
              <p className="user-container__userid">{userId}</p>
              <p className="user-container__joined">Joined on {joinedDate}</p>
            </div>

            <section className="user-container__section">
              <h2 className="user-section__title">Quick Actions</h2>
              <div className="user-buttons">
                <button 
                  type="button" 
                  className="user-button-item"
                  aria-label="View email"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="button-icon" />
                  <span>Email</span>
                </button>

                <button 
                  type="button" 
                  className="user-button-item"
                  aria-label="View password settings"
                >
                  <FontAwesomeIcon icon={faLock} className="button-icon" />
                  <span>Password</span>
                </button>

                <button 
                  type="button" 
                  className="user-button-item"
                  aria-label="View wallet"
                >
                  <FontAwesomeIcon icon={faWallet} className="button-icon" />
                  <span>Wallet</span>
                </button>

                <button 
                  type="button" 
                  className="user-button-item user-submit-reports"
                  aria-label="Submit reports"
                >
                  <FontAwesomeIcon icon={faFlag} className="button-icon" />
                  <span>Submit Reports</span>
                </button>
              </div>
            </section>

            <section className="user-container__section">
              <h2 className="user-section__title">Account Settings</h2>
              <div className="user-settings-list">
                <button 
                  type="button"
                  className="user-settings-item"
                  aria-label="Update email address"
                >
                  <div className="user-settings-item__content">
                    <FontAwesomeIcon icon={faEnvelope} className="settings-icon" />
                    <span>Update Email</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="user-settings-item__arrow" />
                </button>

                <button 
                  type="button"
                  className="user-settings-item"
                  aria-label="Reset password"
                >
                  <div className="user-settings-item__content">
                    <FontAwesomeIcon icon={faRotateRight} className="settings-icon" />
                    <span>Reset Password</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="user-settings-item__arrow" />
                </button>
              </div>
            </section>

            <section className="user-container__section">
              <h2 className="user-section__title">Manage Account</h2>
              <button 
                type="button" 
                className="user-delete-account"
                aria-label="Delete account"
              >
                <FontAwesomeIcon icon={faTrash} className="delete-icon" />
                <span>Delete Account</span>
              </button>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

export default User;

