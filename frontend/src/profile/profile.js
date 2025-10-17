import React, {useEffect, useState} from "react";

import LogoutButton from "../login/logout_button";
import ChangeUsername from "../login/change_username";
import ChangePassword from "../login/change_password";

import './profile.css';
import '../base.css'


import { DJANGO_API_BASE } from "../config";

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Australia/Sydney'
  });
}


function Profile() {
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [joinedAt, setJoinedAt] = useState("");
    const [lastLogin, setLastLogin] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetch_profile = async () => {
                try {
                const res = await fetch(`${DJANGO_API_BASE}/profile/`, {
                    method: "GET",
                    credentials: "include",
                    headers: {'X-Requested-With': 'XMLHttpRequest'},
                });

                if (!res.ok){
                        throw new Error("Failed to fetch profile");
                }

                const data = await res.json();

                setUsername(data.username);
                setRole(data.role);
                setEmail(data.email);
                setJoinedAt(formatDate(data.date_joined));
                setLastLogin(formatDate(data.last_login));
            }
            catch(err) {
                console.log("Fetching profile error: ", err);
                setError(err);
            }
            finally {
                setLoading(false);
            }
        }

        fetch_profile();
    }, []);

    const handleUsernameChange = (newUsername) => {
        setUsername(newUsername);
    }

    if (loading) {
        return <main className="main-content"> <div>Loading Profile... </div> </main>
    }

    if (error) {
        return <main className="main-content"> <div>Error Loading Profile: {error.message} </div> </main>
    }

    return (
        <div className="profile-page">
            <div className="profile-main-content">
            <div className="profile-container">
                {/* Leaderboard */}
                <section className="profile-overview-section" aria-labelledby="profile-overview-heading">
                <div className="profile-info" aria-labelledby="profile-overview-heading">
                    <div className="profile-section-header">profile overview</div>
                    <h1 id="profile-overview-heading" className="profile-section-title">My profile</h1>
                    <p className="profile-description">
                    View your profile and permissions. Feel free to make changes to your username and password.
                    </p>

                    <div className="profile-list">
                    <div className="profile-item">
                        <div className="profile-label">Username</div>
                        <div className="profile-value">{username}</div>
                    </div>

                    <div className="profile-item">
                        <div className="profile-label">Role</div>
                        <div className="profile-value">{role}</div>
                    </div>

                    <div className="profile-item">
                        <div className="profile-label">Email</div>
                        <div className="profile-value">{email}</div>
                    </div>

                    <div className="profile-item">
                        <div className="profile-label">Joined At</div>
                        <div className="profile-value">{joinedAt}</div>
                    </div>

                    <div className="profile-item">
                        <div className="profile-label">Last Login</div>
                        <div className="profile-value">{lastLogin}</div>
                    </div>
                    </div>
                </div>
                </section>
                <section className="profile-overview-section" aria-labelledby="profile-overview-heading">
                    <div className="profile-info" aria-labelledby="profile-overview-heading">
                        <div className="profile-section-header">Make Changes</div>

                        <div className="profile-list">
                        <div className="profile-item">
                            <div className="profile-label">Username</div>
                            <ChangeUsername onUsernameChange={handleUsernameChange}/>
                        </div>

                        <div className="profile-item">
                            <div className="profile-label">Password</div>
                            <ChangePassword/>
                        </div>
                        </div>
                    </div>
                </section>
                <section>
                    <LogoutButton/>
                </section>
            </div>
            </div>
        </div>
    );
}

export default Profile;