import React from 'react';
import '../styles/Dashboard.css';

const STATE_CONFIG = {
  'Balanced': {
    label: 'Balanced',
    badgeClass: 'state-balanced',
    color: 'var(--sage, #718774)',
    summary: 'Your autonomic nervous system is in an optimal, balanced state with strong parasympathetic recovery reserves.',
    accent: '#718774'
  },
  'Loaded': {
    label: 'Loaded',
    badgeClass: 'state-loaded',
    color: 'var(--earth, #A8795D)',
    summary: 'Your nervous system is managing moderate physiological demand. Recovery capacity remains steady.',
    accent: '#A8795D'
  },
  'Strained': {
    label: 'Strained',
    badgeClass: 'state-strained',
    color: 'var(--primary, #D98272)',
    summary: 'Your physiological load is currently elevated and recovery capacity is reduced. Recovery rate is lagging.',
    accent: '#D98272'
  },
  'Dysregulated': {
    label: 'Dysregulated',
    badgeClass: 'state-dysregulated',
    color: 'var(--danger, #B9675D)',
    summary: 'Significant autonomic dysregulation detected with elevated sympathetic tone and suppressed recovery reserves.',
    accent: '#B9675D'
  },
  'Exhausted': {
    label: 'Exhausted',
    badgeClass: 'state-exhausted',
    color: '#8E4A49',
    summary: 'Your recovery reserves are severely depleted with critical accumulated debt. Immediate active rest is advised.',
    accent: '#8E4A49'
  },
  'Burnout Risk': {
    label: 'Burnout Risk',
    badgeClass: 'state-burnout',
    color: '#6B3030',
    summary: 'Critical autonomic depletion detected across physiological markers. Prioritize restorative downtime.',
    accent: '#6B3030'
  }
};

const getStateFromScore = (score) => {
  if (score <= 20) return 'Balanced';
  if (score <= 40) return 'Loaded';
  if (score <= 60) return 'Strained';
  if (score <= 80) return 'Dysregulated';
  if (score <= 90) return 'Exhausted';
  return 'Burnout Risk';
};

const CurrentStateHero = ({ data, previousData }) => {
  if (!data) return null;

  const score = Math.round(data.nsri ?? 0);
  const stateKey = data.state || getStateFromScore(score);
  const config = STATE_CONFIG[stateKey] || STATE_CONFIG['Balanced'];

  // Calculate delta
  let diffText = 'Baseline established';
  let diffClass = 'diff-neutral';
  if (previousData && previousData.nsri !== undefined) {
    const prevScore = Math.round(previousData.nsri);
    const delta = score - prevScore;
    if (delta > 0) {
      diffText = `↑ +${delta} pts load increase`;
      diffClass = 'diff-increase';
    } else if (delta < 0) {
      diffText = `↓ ${delta} pts recovery gain`;
      diffClass = 'diff-decrease';
    } else {
      diffText = '→ Steady vs last reading';
    }
  }

  // Radial progress calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <section className="current-state-hero glass-card section-full" id="overview">
      <div className="hero-inner">
        {/* Left Column: State & Narrative */}
        <div className="hero-narrative-col">
          <div className="hero-header-tag">
            <span className="hero-pulse-dot" style={{ backgroundColor: config.accent }}></span>
            <span className="hero-tag-text">YOUR CURRENT STATE</span>
          </div>

          <div className="hero-state-title-row">
            <h2 className="hero-state-badge" style={{ borderColor: `${config.accent}40`, backgroundColor: `${config.accent}15`, color: config.accent }}>
              {config.label}
            </h2>
            <span className={`hero-diff-badge ${diffClass}`}>
              {diffText}
            </span>
          </div>

          <p className="hero-state-description">
            {config.summary}
          </p>

          {/* NSRI State Progression Bar */}
          <div className="hero-scale-track-wrapper">
            <div className="hero-scale-track">
              <div className="scale-segment balanced" title="0–20: Balanced"></div>
              <div className="scale-segment loaded" title="20–40: Loaded"></div>
              <div className="scale-segment strained" title="40–60: Strained"></div>
              <div className="scale-segment dysregulated" title="60–80: Dysregulated"></div>
              <div className="scale-segment exhausted" title="80–90: Exhausted"></div>
              <div className="scale-segment burnout" title="90–100: Burnout Risk"></div>
              {/* Score Indicator Needle */}
              <div 
                className="scale-needle" 
                style={{ left: `${Math.max(2, Math.min(98, score))}%` }}
              >
                <div className="scale-needle-pin" style={{ backgroundColor: config.accent }}></div>
              </div>
            </div>
            <div className="scale-labels-row">
              <span>0 (Balanced)</span>
              <span>40 (Strained)</span>
              <span>100 (Burnout Risk)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Prominent Circular Score Gauge */}
        <div className="hero-gauge-col">
          <div className="hero-circular-gauge">
            <svg className="gauge-svg" width="160" height="160" viewBox="0 0 160 160">
              <circle
                className="gauge-bg-circle"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="10"
              />
              <circle
                className="gauge-fg-circle"
                cx="80"
                cy="80"
                r={radius}
                strokeWidth="10"
                stroke={config.accent}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="gauge-score-content">
              <div className="gauge-score-number" style={{ color: 'var(--text-primary)' }}>
                {score}
              </div>
              <div className="gauge-score-denom">/ 100</div>
              <div className="gauge-metric-name">NSRI INDEX</div>
            </div>
          </div>
          <div className="gauge-footnote">
            Non-Clinical Autonomic Index
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentStateHero;
