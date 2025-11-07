import React from 'react';
import './Loading2.css';

const Loading2 = ({isLoading, message}) => {
  if(!isLoading) return null;
  return (
    <div id='loading-main-container'>
      <div id='loading-container'>
        <div className='scene'>
          {/* Realistic Modern Vessel SVG */}
          <svg
            className='boat realistic-ship'
            viewBox="0 0 300 100"
            xmlns="http://www.w3.org/2000/svg"
            width="280"
            height="100"
          >
            {/* Hull - Sleek container ship */}
            <path
              d="M20 70 
                 C40 50, 80 40, 120 40 
                 C160 40, 200 45, 240 42 
                 C260 41, 280 45, 285 55 
                 L270 70 
                 C265 72, 240 72, 230 72 
                 H40 
                 Z"
              fill="url(#shipGradient)"
              stroke="#7636e6ff"
              strokeWidth="1.5"
            />

            {/* Superstructure (bridge) */}
            <rect x="200" y="30" width="50" height="20" fill="#e0e6f0" rx="4" />
            <rect x="210" y="34" width="8" height="4" fill="#111a2d" />
            <rect x="222" y="34" width="8" height="4" fill="#111a2d" />
            <rect x="234" y="34" width="8" height="4" fill="#111a2d" />

            {/* Smoke stack */}
            <path d="M80 30 L90 30 L95 15 L75 15 Z" fill="#374151" />
            <path
              className="smoke"
              d="M82 15 Q85 10 88 15"
              fill="none"
              stroke="#64748b"
              strokeWidth="1"
              opacity="0.6"
            />

            {/* Container stacks */}
            <g transform="translate(100, 45)">
              <rect x="0" y="0" width="15" height="10" fill="#ef4444" opacity="0.8" />
              <rect x="18" y="0" width="15" height="10" fill="#3b82f6" opacity="0.8" />
              <rect x="36" y="0" width="15" height="10" fill="#10b981" opacity="0.8" />
              <rect x="0" y="-10" width="15" height="10" fill="#f97316" opacity="0.8" />
              <rect x="18" y="-10" width="15" height="10" fill="#8b5cf6" opacity="0.8" />
            </g>

            {/* Gradient definition */}
            <defs>
              <linearGradient id="shipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>

          {/* Water container with wave animation */}
          <div className='water-container'>
            <div className='water-level'>
              <svg className='waves' viewBox="0 0 1200 100" xmlns="http://www.w3.org/2000/svg">
                <path className='wave wave1' d="M0,50 Q150,30 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z" />
                <path className='wave wave2' d="M0,50 Q150,35 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z" />
                <path className='wave wave3' d="M0,50 Q150,40 300,50 T600,50 T900,50 T1200,50 L1200,100 L0,100 Z" style={{ zIndex: 11 }} />
              </svg>
            </div>
          </div>
        </div>

        <p>{message}</p>
      </div>
    </div>
  );
};

export default Loading2;