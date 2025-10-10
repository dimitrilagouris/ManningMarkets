import React, {useEffect, useState} from "react";

import { DJANGO_API_BASE } from "../config";


function Wallet() {
    const [wallet_id, setWallet_Id] = useState("");
    const [balance, setBalance] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetch_wallet = async () => {
            try {
                const res = await fetch(`${DJANGO_API_BASE}/wallet/`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {'X-Requested-With': 'XMLHttpRequest'},
                });

                if (!res.ok){
                    throw new Error("Failed to fetch wallet");
                }

                const data = await res.json()

                setWallet_Id(data.wallet_id);
                setBalance(data.balance);
            }

            catch (err){
                console.error("Fetching Wallet Error: ", err);
                setError(err);
            }

            finally{
                setLoading(false);
            }
        };

        fetch_wallet();
    }, []);

    if (loading)
    {
        return <main className="main-content"> <div>Loading Wallet... </div> </main>
    }

    if (error)
    {
        return <main className="main-content"> <div>Error Loading Wallet: {error.message} </div> </main>
    }

    return (
        <main className="main-content"> 
            <div>Wallet ID: {wallet_id} </div> 
            <div>Wallet Balance: {balance} </div>
        </main>
    );

}

export default Wallet;