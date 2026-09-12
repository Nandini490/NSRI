import React, { useState } from 'react';
import '../styles/Dashboard.css';

const ScoreBreakdown = ({ data }) => {
  const [showEnvironmental, setShowEnvironmental] = useState(false);

  if (!data) return null;

  const score = Math.round(data.nsri ?? 0);
  const sai = Math.round(data.sai ?? 0);
  const pri = Math.round(data.pri ?? 50);
  const rdt = Math.round(data.rdt ?? 0);
  const ext = data.external_stress_score !== undefined ? Math.round(data.external_stress_score) : 5;

  // Dynamically generate a non-clinical narrative explanation based on actual values
  let dynamicNarrative = '';
  if (score <= 20) {
    dynamicNarrative = 'Your current score is driven by high recovery capacity and minimal acute stress. Your autonomic nervous system is maintaining healthy parasympathetic balance.';
  } else if (score <= 40) {
    dynamicNarrative = 'Your current state reflects normal daytime physiological activity. While moderate load is present, your recovery reserves are keeping accumulated debt near baseline.';
  } else if (score <= 60) {
    if (sai > 50 && pri < 50) {
      dynamicNarrative = 'Your current state is mainly influenced by elevated physiological load combined with reduced recovery capacity. Continued load without sufficient recovery can increase accumulated recovery debt.';
    } else if (rdt > 30) {
      dynamicNarrative = 'Your score is elevated primarily by lingering recovery debt from previous stress periods, even though current acute load has moderated.';
    } else {
      dynamicNarrative = 'Acute physiological demand is currently elevated, putting moderate tension on your recovery reserves.';
    }
  } else if (score <= 80) {
    dynamicNarrative = 'Substantial autonomic strain is detected. High physiological stress and suppressed recovery capacity are actively driving up your recovery debt.';
  } else {
    dynamicNarrative = 'Critical autonomic deficit detected. Accumulated recovery debt is dominant, indicating significant physiological depletion requiring dedicated restorative rest.';
  }

  // Weight contributions
  const saiContrib = (0.20 * sai).toFixed(1);
  const priContrib = (0.30 * (100 - pri)).toFixed(1);
  const rdtContrib = (0.50 * rdt).toFixed(1);

  return (
    <section id="breakdown" className="score-breakdown-section glass-card section-full">
      <div className="section-header-compact">
        <div>
          <h3 className="section-title-text">Why is my score {score}?</h3>
          <p className="section-subtitle-text">
            Proportional algorithmic attribution of physiological load, recovery capacity, and accumulated debt
          </p>
        </div>

        <button 
          className="environmental-toggle-btn"
          onClick={() => setShowEnvironmental(!showEnvironmental)}
          aria-expanded={showEnvironmental}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41" />
          </svg>
          {showEnvironmental ? 'Hide Environment' : 'Environmental Context'}
        </button>
      </div>

      {/* Attribution Bars */}
      <div className="attribution-bars-container">
        {/* Row 1: Physiological Load */}
        <div className="attribution-row">
          <div className="attribution-label-col">
            <span className="attribution-title">Physiological Load (SAI)</span>
            <span className="attribution-calc-note">+ {saiContrib} pts to score (20% weight)</span>
          </div>
          <div className="attribution-bar-wrapper">
            <div className="attribution-bar-track">
              <div 
                className="attribution-bar-fill sai-fill" 
                style={{ width: `${Math.max(2, Math.min(100, sai))}%` }}
              />
            </div>
            <span className="attribution-value-tag">{sai}%</span>
          </div>
        </div>

        {/* Row 2: Recovery Capacity (Inverted load contribution) */}
        <div className="attribution-row">
          <div className="attribution-label-col">
            <span className="attribution-title">Recovery Capacity Deficit (100 - PRI)</span>
            <span className="attribution-calc-note">+ {priContrib} pts to score (30% weight)</span>
          </div>
          <div className="attribution-bar-wrapper">
            <div className="attribution-bar-track">
              <div 
                className="attribution-bar-fill pri-fill" 
                style={{ width: `${Math.max(2, Math.min(100, 100 - pri))}%` }}
              />
            </div>
            <span className="attribution-value-tag">{100 - pri}%</span>
          </div>
        </div>

        {/* Row 3: Recovery Debt */}
        <div className="attribution-row">
          <div className="attribution-label-col">
            <span className="attribution-title">Accumulated Recovery Debt (RDT)</span>
            <span className="attribution-calc-note">+ {rdtContrib} pts to score (50% weight)</span>
          </div>
          <div className="attribution-bar-wrapper">
            <div className="attribution-bar-track">
              <div 
                className="attribution-bar-fill rdt-fill" 
                style={{ width: `${Math.max(2, Math.min(100, rdt))}%` }}
              />
            </div>
            <span className="attribution-value-tag">{rdt}%</span>
          </div>
        </div>
      </div>

      {/* Dynamic Narrative Box */}
      <div className="dynamic-explanation-box">
        <div className="explanation-icon">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <p className="explanation-text">{dynamicNarrative}</p>
      </div>

      {/* Environmental Context Sub-panel */}
      {showEnvironmental && (
        <div className="environmental-context-panel">
          <div className="env-header">
            <h4 className="env-title">Environmental & Situational Context</h4>
            <span className="env-badge">External Stress: {ext}/100</span>
          </div>
          
          <div className="env-cards-grid">
            <div className="env-card">
              <span className="env-card-icon">🌤️</span>
              <div className="env-card-content">
                <span className="env-card-label">Weather & Ambient Temp</span>
                <span className="env-card-val">24°C • Moderate Comfort</span>
              </div>
            </div>

            <div className="env-card">
              <span className="env-card-icon">🍃</span>
              <div className="env-card-content">
                <span className="env-card-label">Air Quality Index (AQI)</span>
                <span className="env-card-val">42 AQI • Clean Air</span>
              </div>
            </div>

            <div className="env-card">
              <span className="env-card-icon">📍</span>
              <div className="env-card-content">
                <span className="env-card-label">Regional Hazards (GDACS)</span>
                <span className="env-card-val">No proximate events (&lt;500km)</span>
              </div>
            </div>
          </div>

          <p className="environmental-disclaimer-text">
            These factors provide additional situational context and do not independently determine your NSRI state.
          </p>
        </div>
      )}
    </section>
  );
};

export default ScoreBreakdown;
