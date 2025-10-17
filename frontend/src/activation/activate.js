import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { DJANGO_API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';

function Activate() {
    const { token } = useParams();
    const [status, setStatus] = useState('Activating your account...')
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${DJANGO_API_BASE}/activate/${token}` , {
            method: 'POST',
        }).then(res => res.json())
        .then(data => {
            setStatus('Your account has been activated!');
            navigate("/login");
        })
        .catch(err => console.log(err));
    }, [token, navigate]);

    return (
        <div>
        <h1>Account Activation</h1>
        <p>{status}</p>
        </div>
    );
    
}

export default Activate