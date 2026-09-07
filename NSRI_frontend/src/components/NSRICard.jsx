import React, { useState } from 'react';
import '../styles/Dashboard.css';

const NSRICard = ({ current, previous }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!current) return null;

  const currentScore = Math.round(current.nsri);
  
  let changeText = 'No previous score available';
  let changeClass = '';
  if (previous) {
    const prevScore = Math.round(previous.nsri);
    const diff = currentScore - prevScore;
    if (diff > 0) {
      changeText = `+${diff} this week`;
      changeClass = 'positive';
    } else if (diff < 0) {
      changeText = `${diff} this week`;
    } else {
      changeText = 'No change this week';
    }
  }

  // Determine status based on actual NSRI score
  let statusText = 'Balanced';
  if (currentScore >= 95) statusText = 'Burnout Risk';
  else if (currentScore >= 80) statusText = 'Exhausted';
  else if (currentScore >= 60) statusText = 'Dysregulated';
  else if (currentScore >= 40) statusText = 'Strained';
  else if (currentScore >= 20) statusText = 'Loaded';
  else statusText = 'Balanced';

  // Build contributing factors
  const factors = [];
  if (current.sai > 50) factors.push('Stress');
  if (current.pri < 50) factors.push('Recovery');
  if (current.rdt > 0) factors.push('Environment');

  return (
    <div className="glass-card section-third nsri-card">
      <div className="glass-card-header">
        <div className="glass-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10 M18 20V4 M6 20v-4" />
          </svg>
          NSRI Score
        </div>
      </div>
      
      <div className="nsri-content">
        <div className="nsri-score-row">
          <div className="nsri-score-value">
            {currentScore} <span className="nsri-score-max">/ 100</span>
          </div>
          <div className={`nsri-change ${changeClass}`}>
            {changeText}
          </div>
        </div>
        
        <div className="nsri-status-label">{statusText}</div>
        
        <div className="nsri-factors">
          <h5 className="factors-title">Top Contributing Factors:</h5>
          <div className="factors-tags">
            {factors.length > 0 ? factors.map((factor, idx) => (
              <span key={idx} className="factor-tag">{factor}</span>
            )) : (
              <span className="factor-tag">Data collecting...</span>
            )}
          </div>
        </div>

        <div className="nsri-disclaimer-section">
          <button 
            className="disclaimer-toggle" 
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
          >
            Why am I seeing this?
            <svg 
              className={`toggle-icon ${isExpanded ? 'expanded' : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          
          {isExpanded && (
            <div className="disclaimer-content">
              <p>
                The NSRI is calculated from wellness data and signals processed by our backend. 
                It conceptually considers stress patterns, recovery indicators, sleep, activity, and environmental signals.
              </p>
              <p className="disclaimer-warning">
                <strong>NSRI is a wellness and self-tracking indicator, not a medical diagnosis.</strong>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NSRICard;
