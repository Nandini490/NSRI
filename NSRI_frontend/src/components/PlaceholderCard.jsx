import React from 'react';
import '../styles/Dashboard.css';

const PlaceholderCard = ({ title, icon, className = '' }) => {
  return (
    <div className={`glass-card ${className}`}>
      <div className="glass-card-header">
        <div className="glass-card-title">
          {icon && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
          )}
          {title}
        </div>
      </div>
      <div className="glass-card-content">
        <span className="placeholder-text">Coming Soon</span>
      </div>
    </div>
  );
};

export default PlaceholderCard;
