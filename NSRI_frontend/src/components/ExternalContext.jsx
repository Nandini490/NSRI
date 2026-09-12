import React from 'react';
import '../styles/Dashboard.css';

const ExternalContext = ({ score }) => {
  // If no score was fetched or provided, gracefully hide or show unavailable
  if (score === null || score === undefined) {
    return (
      <div className="glass-card section-third">
        <div className="glass-card-header">
          <div className="glass-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Environmental Stress
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <p className="placeholder-text">Environmental data is currently unavailable.</p>
        </div>
      </div>
    );
  }

  // Interpret the score roughly (0-100 scale)
  let interpretation = 'Favorable';
  if (score > 60) interpretation = 'High Stress Factors';
  else if (score > 30) interpretation = 'Moderate Factors';

  return (
    <div className="glass-card section-third">
      <div className="glass-card-header">
        <div className="glass-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Environmental Stress
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: '600' }}>{Math.round(score)}</span>
          <span style={{ marginLeft: '4px', opacity: 0.7 }}>/ 100</span>
        </div>
        <p style={{ fontWeight: '500', marginBottom: '8px' }}>{interpretation}</p>
        <p className="placeholder-text" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
          This contextual score aggregates real-time Weather, Air Quality (AQI), News Sentiment, and Disaster Alerts in your area.
        </p>
      </div>
    </div>
  );
};

export default ExternalContext;
