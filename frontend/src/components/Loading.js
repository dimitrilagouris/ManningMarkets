import React from 'react';
import './Loading.css';

function Loading() {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-bar-track">
                    <div className="loading-bar-fill" />
                </div>
                <p className="loading-label">Loading</p>
            </div>
        </div>
    );
}

export default Loading;