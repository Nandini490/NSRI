import React from 'react';
import '../styles/Dashboard.css';

const TodaysOverview = ({ data }) => {
  if (!data) return null;

  const currentScore = Math.round(data.nsri * 100);

  let statusLabel = 'Balanced';
  let summary = 'Your wellness patterns are currently stable. Consider maintaining your routine.';
  const suggestions = [];

  if (currentScore >= 60) {
    statusLabel = 'Doing Well';
    summary = 'Your recovery indicators and stress patterns show a highly balanced state today.';
    suggestions.push('Maintain your consistent sleep schedule');
    suggestions.push('Take time to enjoy your positive momentum');
  } else if (currentScore >= 40) {
    statusLabel = 'Balanced';
    summary = 'You are maintaining a steady baseline across key wellness indicators.';
    if (data.sai > 0.5) suggestions.push('Try a short breathing exercise to manage stress');
    if (data.pri < 0.5) suggestions.push('Consider an earlier bedtime tonight for better recovery');
    suggestions.push('Remember to stay hydrated throughout the day');
  } else {
    statusLabel = 'Needs Attention';
    summary = 'Your data suggests you might be experiencing increased load or reduced recovery.';
    suggestions.push('Take a short break from screens when possible');
    suggestions.push('Prioritize rest and light activities today');
    suggestions.push('Consider reducing caffeine intake later in the day');
  }

  // Ensure we always have 2-3 suggestions
  const topSuggestions = suggestions.slice(0, 3);

  return (
    <div className="glass-card section-two-thirds todays-overview">
      <div className="glass-card-header">
        <div className="glass-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Today's Overview
        </div>
        <div className={`status-badge ${statusLabel === 'Doing Well' ? 'doing-well' : ''}`}>
          {statusLabel}
        </div>
      </div>
      
      <div className="overview-content">
        <p className="overview-summary">{summary}</p>
        
        <div className="suggestions-container">
          <h4 className="suggestions-title">Focus for today:</h4>
          <ul className="suggestions-list">
            {topSuggestions.map((suggestion, idx) => (
              <li key={idx} className="suggestion-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TodaysOverview;
