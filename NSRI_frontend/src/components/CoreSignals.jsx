import React, { useState } from 'react';
import '../styles/Dashboard.css';

const SignalCard = ({ title, code, value, subtitle, description, weight, color, isInverse = false, formulaNote }) => {
  const numVal = typeof value === 'number' ? Math.round(value) : 0;
  const clampedVal = Math.max(0, Math.min(100, numVal));
  
  // Interpretation
  let statusText = 'Optimal';
  let badgeClass = 'signal-optimal';
  if (isInverse) {
    // Higher is better (e.g. PRI)
    if (clampedVal >= 70) {
      statusText = 'High Recovery';
      badgeClass = 'signal-optimal';
    } else if (clampedVal >= 40) {
      statusText = 'Moderate Reserves';
      badgeClass = 'signal-moderate';
    } else {
      statusText = 'Depleted';
      badgeClass = 'signal-elevated';
    }
  } else {
    // Lower is better (e.g. SAI, RDT)
    if (clampedVal <= 25) {
      statusText = 'Low / Rested';
      badgeClass = 'signal-optimal';
    } else if (clampedVal <= 60) {
      statusText = 'Moderate Load';
      badgeClass = 'signal-moderate';
    } else {
      statusText = 'Elevated Load';
      badgeClass = 'signal-elevated';
    }
  }

  return (
    <div className="signal-card glass-card">
      <div className="signal-header">
        <div className="signal-title-group">
          <span className="signal-badge" style={{ backgroundColor: `${color}18`, color: color, borderColor: `${color}35` }}>
            {code}
          </span>
          <div>
            <h4 className="signal-title">{title}</h4>
            <span className="signal-subtitle-text">{subtitle}</span>
          </div>
        </div>
        <div className="signal-header-right">
          <span className={`signal-mini-badge ${badgeClass}`}>
            {statusText}
          </span>
          <span className="signal-weight-chip">Weight: {weight}</span>
        </div>
      </div>

      <div className="signal-value-row">
        <div className="signal-value" style={{ color: color }}>
          {numVal} <span className="signal-value-max">/ 100</span>
        </div>
      </div>

      <div className="signal-progress-track">
        <div 
          className="signal-progress-fill" 
          style={{ 
            width: `${clampedVal}%`, 
            backgroundColor: color 
          }}
        />
      </div>

      <p className="signal-description">{description}</p>
      <div className="signal-formula-footnote">{formulaNote}</div>
    </div>
  );
};

const CoreSignals = ({ data }) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!data) return null;

  const sai = data.sai ?? 0;
  const pri = data.pri ?? 50;
  const rdt = data.rdt ?? 0;

  return (
    <section id="signals" className="core-signals-container section-full">
      <div className="section-header-compact">
        <div>
          <h3 className="section-title-text">What is driving my current state?</h3>
          <p className="section-subtitle-text">
            Three real-time autonomic state indicators computed by the stateful differential engine
          </p>
        </div>

        <button 
          className="technical-toggle-btn"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          aria-expanded={showTechnicalDetails}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          {showTechnicalDetails ? 'Hide Calculation' : 'How is this calculated?'}
        </button>
      </div>

      <div className="signals-grid">
        <SignalCard
          code="SAI"
          title="Stress Load"
          subtitle="Recent physiological stress load"
          value={sai}
          weight="20%"
          color="var(--primary, #D98272)"
          description="Continuous accumulation of acute physiological strain from real-time ML inference."
          formulaNote="EMA Time Constant: τ = 4.0 hours"
        />

        <SignalCard
          code="PRI"
          title="Recovery Capacity"
          subtitle="Current recovery capacity"
          value={pri}
          weight="30%"
          color="var(--sage, #718774)"
          isInverse={true}
          description="Parasympathetic replenishment reserves calculated from normalized resting HRV and heart rate."
          formulaNote="EMA Time Constant: τ = 8.0 hours"
        />

        <SignalCard
          code="RDT"
          title="Recovery Debt"
          subtitle="Accumulated recovery debt"
          value={rdt}
          weight="50%"
          color="var(--earth, #A8795D)"
          description="Longitudinal deficit that builds when physiological stress exceeds recovery over multi-day windows."
          formulaNote="EMA Time Constant: τ = 48.0 hours"
        />
      </div>

      {/* Expandable Technical Calculation Details */}
      {showTechnicalDetails && (
        <div className="technical-calculation-card glass-card">
          <h4 className="tech-calc-title">NSRI Mathematical Composite Formulation</h4>
          <div className="math-equation-box">
            <code>NSRI = 0.20 · SAI + 0.30 · (100 − PRI) + 0.50 · RDT</code>
          </div>
          <div className="tech-calc-grid">
            <div className="tech-calc-item">
              <strong>1. SAI (Stress Accumulation Index)</strong>
              <p>Fuses WESAD Random Forest and MMASH XGBoost stress probabilities: <code>SAI(t) = SAI(t-1)·e^(-Δt/4) + S·(1 - e^(-Δt/4))</code></p>
            </div>
            <div className="tech-calc-item">
              <strong>2. PRI (Parasympathetic Recovery Index)</strong>
              <p>Captures vagal tone from normalized HRV (RMSSD/SDNN) and resting heart rate: <code>PRI = 0.6·HRV_norm + 0.4·(1 - RHR_norm)</code></p>
            </div>
            <div className="tech-calc-item">
              <strong>3. RDT (Recovery Debt Tracker)</strong>
              <p>Quantifies unresolved deficit with a 48-hour continuous half-life: <code>ΔDebt = max(0, SAI - PRI)</code>, decaying exponentially during sleep and rest.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CoreSignals;
