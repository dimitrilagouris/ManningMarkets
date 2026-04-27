import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import clientApi from '../../api/clientApi';
import { formatDate } from '../../utils/dateFormatters';

import ChangeUsername from "./ChangeUsernameForm";
import ChangePassword from "./ChangePasswordForm";
import LogoutButton from "./LogoutButton";

import './profile.css';
import '../../styles/base.css';
import Loading from "../../components/common/Loading";

/**
 * @typedef {Object} ProfileData
 * @property {string} username
 * @property {string} role
 * @property {string} email
 * @property {string} date_joined
 * @property {string} last_login
 */

/**
 * Renders the top-level user profile management page.
 * @returns {JSX.Element}
 */
export default function ProfilePage() {
    /** @type {[ProfileData|null, React.Dispatch<React.SetStateAction<ProfileData|null>>]} */
    const [data, setData] = useState(null);
    /** @type {[Error|null, React.Dispatch<React.SetStateAction<Error|null>>]} */
    const [error, setError] = useState(null);
    /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} */
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        clientApi.get('/profile/')
            .then(({ data: resData }) => setData(resData))
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;
    if (error) return <div className="main-content">Failed to load profile.</div>;

    return (
        <div className="profile-page">
            <div className="profile-main-content">
                <div className="profile-container">
                    <ProfileDetails data={data} />

                    <section className="profile-content-section" aria-labelledby="profile-changes-heading">
                        <div className="profile-content-header">
                            <h2 id="profile-changes-heading" className="profile-content-title">Make Changes</h2>
                        </div>
                        <div className="profile-info">
                            <div className="profile-list">
                                <div className="profile-item">
                                    <div className="profile-label">Username</div>
                                    <ChangeUsername onUsernameChange={(u) => setData({ ...data, username: u })} />
                                </div>
                                <div className="profile-item">
                                    <div className="profile-label">Password</div>
                                    <ChangePassword />
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <LogoutButton />
                    </section>
                </div>
            </div>
        </div>
    );
}

/**
 * Renders the read-only overview of the user's profile data.
 * @param {{ data: ProfileData }} props
 * @returns {JSX.Element}
 */
const ProfileDetails = ({ data }) => (
    <section className="profile-overview-section" aria-labelledby="profile-overview-heading">
        <div className="profile-info">
            <div className="profile-section-header">profile overview</div>
            <h1 id="profile-overview-heading" className="profile-section-title">My profile</h1>
            <p className="profile-description">
                View your profile and permissions. Feel free to make changes to your username and password.
            </p>
            <div className="profile-list">
                {['username', 'role', 'email'].map(key => (
                    <div key={key} className="profile-item">
                        <div className="profile-label">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                        <div className="profile-value">{data[key]}</div>
                    </div>
                ))}
                <div className="profile-item">
                    <div className="profile-label">Joined At</div>
                    <div className="profile-value">{formatDate(data.date_joined)}</div>
                </div>
                <div className="profile-item">
                    <div className="profile-label">Last Login</div>
                    <div className="profile-value">{formatDate(data.last_login)}</div>
                </div>
            </div>
        </div>
    </section>
);

ProfileDetails.propTypes = {
    data: PropTypes.shape({
        username: PropTypes.string.isRequired,
        role: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        date_joined: PropTypes.string.isRequired,
        last_login: PropTypes.string,
    }).isRequired,
};