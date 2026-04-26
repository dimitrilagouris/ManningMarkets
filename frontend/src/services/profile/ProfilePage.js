import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import clientApi from '../../api/clientApi';

import ChangeUsername from "../login/ChangeUsernameForm";
import ChangePassword from "../login/ChangePasswordForm";
import LogoutButton from "../login/LogoutButton";

import './profile.css';
import '../../styles/base.css';
import Loading from "../../components/common/Loading";

const formatDate = (isoString) => new Date(isoString).toLocaleString('en-AU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'Australia/Sydney'
});

function ProfilePage() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        clientApi.get('/profile/')
            .then(({ data }) => setData(data))
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
    data: PropTypes.object.isRequired,
};

export default ProfilePage;