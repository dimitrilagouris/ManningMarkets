import React, {useEffect, useState} from "react";

import LogoutButton from "../login/logout_button";
import ChangeUsername from "../login/change_username";

import { DJANGO_API_BASE } from "../config";

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
                        throw new Error("Failed to fetch wallet");
                }

                const data = await res.json();

                setUsername(data.username);
                setRole(data.role);
                setEmail(data.email);
                setJoinedAt(data.date_joined);
                setLastLogin(data.last_login)
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

    if (loading) {
        return <main className="main-content"> <div>Loading Profile... </div> </main>
    }

    if (error) {
        return <main className="main-content"> <div>Error Loading Profile: {error.message} </div> </main>
    }

    return (
        <main className="main-content"> 
            <div>Username: {username} </div> 
            <div>Email: {email} </div>
            <div>Role: {role} </div>
            <div>Joined at: {joinedAt}</div>
            <div>Last Login: {lastLogin}</div>
            <LogoutButton />
            <ChangeUsername />
        </main>
    );
}

export default Profile;