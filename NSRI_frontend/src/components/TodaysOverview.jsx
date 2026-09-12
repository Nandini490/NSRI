import React from 'react';
import '../styles/Dashboard.css';

const TodaysOverview = ({ data }) => {
  if (!data) return null;

  const currentScore = Math.round(data.nsri);

  // Check data staleness
  let isStale = false;
  let hoursOld = 0;
  if (data.created_at) {
    const ageMs = Date.now() - new Date(data.created_at).getTime();
    hoursOld = Math.floor(ageMs / (1000 * 60 * 60));
    isStale = hoursOld >= 12;
  }

  let statusLabel = data.state || 'Balanced';
  let summary = 'Your autonomic nervous system is in an optimal, balanced state with high recovery capacity.';
  const suggestions = [];

  if (isStale) {
    statusLabel = 'Data is stale';
    summary = `Your last measurement was ${hoursOld} hours ago. Your baseline is mathematically decaying towards neutral.`;
    suggestions.push('Sync a new measurement for an updated status');
  } else if (currentScore <= 20) {
    statusLabel = 'Balanced';
    summary = 'Your autonomic nervous system is in an optimal, balanced state with high recovery capacity.';
    suggestions.push('Maintain your current recovery habits and sleep schedule');
    suggestions.push('Good capacity for high-focus or physical activities today');
    suggestions.push('Stay consistent with your daily hydration and nutrition');
  } else if (currentScore <= 40) {
    statusLabel = 'Loaded';
    summary = 'Your nervous system is managing moderate baseline activity with steady recovery.';
    if (data.sai > 30) suggestions.push('Take brief micro-breaks between cognitive tasks');
    if (data.pri < 60) suggestions.push('Prioritize adequate sleep tonight to replenish reserves');
    suggestions.push('Incorporate light stretching or a relaxed walk today');
  } else if (currentScore <= 60) {
    statusLabel = 'Strained';
    summary = 'Elevated stress signals and reduced recovery capacity are creating physiological strain.';
    suggestions.push('Engage in 5 minutes of resonant breathing (4s in, 6s out)');
    suggestions.push('Avoid intense late-day physical or cognitive exertion');
    suggestions.push('Ensure an earlier wind-down routine before sleep');
  } else if (currentScore <= 80) {
    statusLabel = 'Dysregulated';
    summary = 'Significant stress accumulation and recovery debt indicate an unrecovered nervous system.';
    suggestions.push('Minimize non-essential stressors and screen exposure');
    suggestions.push('Prioritize deep rest and restorative activities');
    suggestions.push('Hydrate and avoid excessive caffeine intake');
  } else if (currentScore <= 90) {
    statusLabel = 'Exhausted';
    summary = 'Your recovery reserves are severely depleted. Immediate physiological rest is recommended.';
    suggestions.push('Schedule active recovery periods and quiet time immediately');
    suggestions.push('Avoid all high-intensity mental or physical stressors');
    suggestions.push('Focus on extended, uninterrupted sleep tonight');
  } else {
    statusLabel = 'Burnout Risk';
    summary = 'Critical recovery deficit detected across all physiological and environmental markers.';
    suggestions.push('Halt demanding tasks and engage in immediate rest');
    suggestions.push('Practice prolonged relaxation or parasympathetic recovery exercises');
    suggestions.push('Ensure comprehensive sleep and recovery protocol today');
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
        <div className={`status-badge ${statusLabel.toLowerCase().replace(/\s+/g, '-')} ${isStale ? 'stale' : ''}`}>
          {statusLabel}
        </div>
      </div>
      
      <div className="overview-content">
        <p className="overview-summary">{summary}</p>
        
        <div className="suggestions-container">
          <h4 className="suggestions-title">{isStale ? 'Action required:' : 'Focus for today:'}</h4>
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
