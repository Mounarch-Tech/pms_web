import React from 'react';
import './Loading.css';

const Loading = ({ isLoading }) => {
    if (!isLoading) return null;

    return (
        <div
            id='loading-main-container'
            aria-busy="true"
            aria-label="Loading, please wait"
        >
            <div id='loading-content-container'>
                <div
                    id='loading-main-loader'
                    role="progressbar"
                    aria-valuetext="Loading"
                ></div>
            </div>
        </div>
    );
};

export default Loading;
