import React, { useState, useEffect } from 'react';
import { fetchExternalContext } from '../../services/externalService';
import './NIRAInsight.css';

const NIRAInsight = ({ data = null, previousData = null, history = [] }) => {
  const [externalContext, setExternalContext] = useState(null);
  const [showDeltaDrawer, setShowDeltaDrawer] = useState(false);

  // Fetch external environmental context
  useEffect(() => {
    let isMounted = true;
    const loadExternal = async () => {
      const ext = await fetchExternalContext(37.7749, -122.4194);
      if (isMounted && ext) {
        setExternalContext(ext);
      }
    };
    loadExternal();
    return () => { isMounted = false; };
  }, []);

  const hasData = data !== null && (data.nsri !== undefined || data.nsri_score !== undefined || data.composite_nsri !== undefined);

  // Extract core metrics
  const score = hasData ? Math.round(data.nsri ?? data.nsri_score ?? data.composite_nsri ?? 0) : null;
  const state = hasData ? (data.state ?? data.nsri_state ?? 'Balanced') : 'Balanced';
  const sai = hasData ? Math.round(data.sai ?? 0) : null;
  const pri = hasData ? Math.round(data.pri ?? 50) : null;
  const rdt = hasData ? Math.round(data.rdt ?? 0) : null;

  const prevScore = previousData ? Math.round(previousData.nsri ?? previousData.nsri_score ?? previousData.composite_nsri ?? 0) : null;
  const prevSai = previousData ? Math.round(previousData.sai ?? 0) : null;
  const prevPri = previousData ? Math.round(previousData.pri ?? 50) : null;
  const prevRdt = previousData ? Math.round(previousData.rdt ?? 0) : null;

  // 1. "WHAT'S HAPPENING?" — Dynamic Pattern Identification
  let whatsHappeningText = 'Waiting for active telemetry data...';
  if (hasData) {
    if (score <= 20) {
      whatsHappeningText = 'Your autonomic signals reflect high recovery capacity and balanced physiological demand.';
    } else if (sai >= 50 && pri <= 45 && rdt >= 35) {
      whatsHappeningText = 'Your current state reflects a combination of elevated physiological load and accumulated recovery debt, while recovery capacity has not fully caught up.';
    } else if (sai >= 50 && sai > (100 - pri)) {
      whatsHappeningText = 'Your current physiological load is the strongest contributor to your NSRI state.';
    } else if (pri < 40) {
      whatsHappeningText = 'Your recovery capacity is currently lower than the level of physiological demand.';
    } else if (rdt >= 35) {
      whatsHappeningText = 'Accumulated recovery debt is contributing significantly to your current state.';
    } else if (score <= 40) {
      whatsHappeningText = 'Your physiological load is beginning to rise, but recovery capacity remains steady and responsive.';
    } else {
      whatsHappeningText = 'Elevated physiological strain is placing moderate tension on your recovery reserves.';
    }
  }

  // 2. Primary Contributors Tags
  const saiTag = !hasData ? '—' : sai >= 50 ? 'HIGH' : sai >= 25 ? 'MODERATE' : 'LOW';
  const saiTagClass = !hasData ? '' : sai >= 50 ? 'high' : sai >= 25 ? 'elevated' : 'moderate';

  const priTag = !hasData ? '—' : pri >= 65 ? 'OPTIMAL' : pri >= 40 ? 'MODERATE' : 'REDUCED';
  const priTagClass = !hasData ? '' : pri >= 65 ? 'optimal' : pri >= 40 ? 'moderate' : 'high';

  const rdtTag = !hasData ? '—' : rdt >= 40 ? 'ELEVATED' : rdt >= 15 ? 'MODERATE' : 'MINIMAL';
  const rdtTagClass = !hasData ? '' : rdt >= 40 ? 'high' : rdt >= 15 ? 'elevated' : 'moderate';

  // 3. Recovery Signal Calculation
  let recoverySignal = 'Stable';
  let recoverySignalClass = 'stable';
  let recoverySignalDesc = 'Autonomic recovery signals are maintaining a steady trajectory.';

  if (prevScore !== null && score !== null) {
    const delta = score - prevScore;
    if (delta <= -2) {
      recoverySignal = 'Improving';
      recoverySignalClass = 'improving';
      recoverySignalDesc = 'Recovery appears to be improving as physiological load decreases.';
    } else if (delta >= 2) {
      recoverySignal = 'Declining';
      recoverySignalClass = 'declining';
      recoverySignalDesc = 'Recovery reserves are lagging as accumulated load rises.';
    }
  } else if (history && history.length >= 2) {
    const last = history[history.length - 1]?.data?.nsri ?? 0;
    const secondLast = history[history.length - 2]?.data?.nsri ?? 0;
    if (last < secondLast - 2) {
      recoverySignal = 'Improving';
      recoverySignalClass = 'improving';
      recoverySignalDesc = 'Recovery appears to be improving across recent monitoring points.';
    } else if (last > secondLast + 2) {
      recoverySignal = 'Declining';
      recoverySignalClass = 'declining';
      recoverySignalDesc = 'Recovery capacity is declining under sustained daily demand.';
    }
  }

  // 4. Combined NIRA Interpretation (Physiology + State + External Context)
  let niraInterpretationText = 'Awaiting sufficient telemetry to provide contextual analysis.';
  if (hasData) {
    const extRelevance = externalContext?.relevance || 'Low Relevance';
    const tempText = externalContext?.weather?.temperature || '24°C';

    if (score <= 20) {
      niraInterpretationText = `Your current state is characterized by optimal vagal tone and minimal accumulated debt. External conditions (${tempText}) add minimal contextual strain, allowing your parasympathetic reserves to remain dominant.`;
    } else if (score <= 40) {
      niraInterpretationText = `Your current signals show moderate physiological engagement with healthy recovery pacing. Environmental context remains at ${extRelevance.toLowerCase()}, with internal physiological load as the main driver.`;
    } else if (score <= 60) {
      niraInterpretationText = `Your current NSRI state appears to be driven primarily by elevated physiological load relative to recovery capacity. Environmental factors are present as contextual conditions (${extRelevance}), but physiological signals remain the primary contributor.`;
    } else if (score <= 80) {
      niraInterpretationText = `Substantial autonomic strain is detected. Elevated physiological load and suppressed recovery capacity are actively increasing accumulated debt. Contextual environmental load should be minimized to facilitate restorative pacing.`;
    } else {
      niraInterpretationText = `Critical recovery debt detected. Your recovery capacity is currently insufficient to offset accumulated demand. Restorative protocol without additional physical or mental load is strongly indicated.`;
    }
  }

  // 5. "WHAT CAN I DO NOW?" — Contextual Recommendation
  let whatCanIDoText = 'Connect telemetry stream to view personalized recovery actions.';
  if (hasData) {
    if (score <= 20) {
      whatCanIDoText = 'Continue your normal routine while maintaining regular hydration and scheduled recovery periods.';
    } else if (score <= 40) {
      whatCanIDoText = 'Consider taking a short 5-minute breather and avoid prolonged uninterrupted high-demand tasks.';
    } else if (score <= 60) {
      whatCanIDoText = 'Take a low-stimulation break, hydrate, practice slow rhythmic breathing, and reduce continuous screen exposure.';
    } else if (score <= 80) {
      whatCanIDoText = 'Prioritize immediate recovery. Step away from high-demand cognitive or physical tasks and engage in down-regulation pacing.';
    } else {
      whatCanIDoText = 'Restorative recovery is strongly recommended. Cease non-essential tasks, rest in a calm environment, and focus on restorative sleep.';
    }
  }

  // 6. "Why Did My Score Change?" Narrative
  const hasComparison = prevScore !== null && score !== null;
  const scoreDelta = hasComparison ? score - prevScore : 0;
  const saiDelta = (prevSai !== null && sai !== null) ? sai - prevSai : 0;
  const priDelta = (prevPri !== null && pri !== null) ? pri - prevPri : 0;
  const rdtDelta = (prevRdt !== null && rdt !== null) ? rdt - prevRdt : 0;

  let deltaNarrative = '';
  if (hasComparison) {
    if (scoreDelta > 0) {
      deltaNarrative = `Your NSRI increased by +${scoreDelta} points primarily because physiological load ${saiDelta >= 0 ? `rose (+${saiDelta})` : `moderated (${saiDelta})`}, while recovery capacity ${priDelta <= 0 ? `decreased (${priDelta})` : `improved (+${priDelta})`}.${rdtDelta > 0 ? ` Accumulated recovery debt also increased (+${rdtDelta}).` : ''}`;
    } else if (scoreDelta < 0) {
      deltaNarrative = `Your NSRI improved by ${scoreDelta} points as recovery capacity ${priDelta >= 0 ? `expanded (+${priDelta})` : `moderated (${priDelta})`} and acute load ${saiDelta <= 0 ? `decreased (${saiDelta})` : `rose (+${saiDelta})`}. Recovery debt clearance is actively underway.`;
    } else {
      deltaNarrative = 'Your NSRI score remained steady between consecutive measurements with balanced physiological inputs.';
    }
  } else {
    deltaNarrative = 'Previous monitoring data is not available for comparison yet. As you continue streaming data or switch scenarios, comparative deltas will appear here.';
  }

  // 7. Dispatch custom query to NIRA Chat
  const handleAskNIRA = (customPrompt = null) => {
    const query = customPrompt || (
      sai >= 50 
        ? 'Why is physiological load currently my strongest contributor?' 
        : pri < 40 
          ? 'Why is my recovery capacity currently reduced and how can I support it?' 
          : 'Explain my current NIRA Insight interpretation and recovery signal.'
    );

    window.dispatchEvent(new CustomEvent('nira-ask-query', { detail: { query } }));
    
    const chatEl = document.querySelector('#nira-assistant');
    if (chatEl) {
      chatEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const stateClass = (state || 'Balanced').toLowerCase().replace(/\s+/g, '-');

  return (
    <section id="nira-insight" className="nira-insight-section section-full">
      {/* Header */}
      <div className="insight-header-row">
        <div className="insight-title-group">
          <div className="insight-badge-row">
            <span className="insight-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4 M12 8h.01" />
              </svg>
              Continuous Intelligence
            </span>
            <span className="insight-status-pill">
              <span className="status-dot-pulse" />
              {hasData ? 'Analyzing current monitoring data' : 'Waiting for monitoring data...'}
            </span>
          </div>
          <h3 className="insight-main-title">NIRA INSIGHT</h3>
          <p className="insight-subtitle">Context-aware continuous interpretation of your current nervous-system state</p>
          <p className="insight-micro-tagline">
            "NSRI does not interpret a single signal in isolation. NIRA considers physiological patterns, recovery dynamics, historical trend, and relevant external context together."
          </p>
        </div>
      </div>

      {/* Current State Banner */}
      <div className="insight-state-banner">
        <div className="state-score-block">
          <div className="state-score-circle">
            <span className="state-score-num">{score ?? '—'}</span>
            <span className="state-score-label">NSRI</span>
          </div>
          <div className="state-desc-col">
            <div className="state-desc-heading">
              <span>Current Autonomic State:</span>
              <span className={`state-classified-pill ${stateClass}`}>{state}</span>
            </div>
            <div className="state-quick-chips">
              <div className="quick-chip">
                <span className="label">SAI Load:</span>
                <strong>{sai ?? '—'}</strong>
              </div>
              <div className="quick-chip">
                <span className="label">PRI Capacity:</span>
                <strong>{pri ?? '—'}</strong>
              </div>
              <div className="quick-chip">
                <span className="label">RDT Debt:</span>
                <strong>{rdt ?? '—'}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="state-recovery-signal-col">
          <div className={`recovery-signal-pill ${recoverySignalClass}`}>
            <span>Recovery Signal:</span>
            <strong>
              {recoverySignal === 'Improving' ? '↗ Improving' : recoverySignal === 'Declining' ? '↘ Declining' : '→ Stable'}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid: What's Happening & Primary Contributors */}
      <div className="insight-grid-layout">
        {/* Block 1: What's Happening? */}
        <div className="insight-card-block">
          <div>
            <div className="block-header">
              <span className="block-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                What's Happening?
              </span>
            </div>
            <p className="block-highlight-text">{whatsHappeningText}</p>
          </div>
          <p className="insight-subtitle" style={{ fontSize: '12px', marginTop: '12px' }}>
            Derived in real time from composite ML stress inference and differential autonomic state equations.
          </p>
        </div>

        {/* Block 2: Primary Contributors */}
        <div className="insight-card-block">
          <div className="block-header">
            <span className="block-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Primary Contributors
            </span>
          </div>

          <div className="contributors-list">
            {/* SAI */}
            <div className="contributor-item">
              <div className="contributor-header">
                <span className="contributor-name">Physiological Load (SAI)</span>
                <span className={`contributor-tag ${saiTagClass}`}>{saiTag} ({sai ?? 0}%)</span>
              </div>
              <div className="contributor-bar-track">
                <div className="contributor-bar-fill sai-fill" style={{ width: `${Math.max(2, Math.min(100, sai ?? 0))}%` }} />
              </div>
            </div>

            {/* PRI */}
            <div className="contributor-item">
              <div className="contributor-header">
                <div>
                  <span className="contributor-name">Recovery Capacity (PRI)</span>
                  <span className="contributor-note"> — High is optimal</span>
                </div>
                <span className={`contributor-tag ${priTagClass}`}>{priTag} ({pri ?? 50}%)</span>
              </div>
              <div className="contributor-bar-track">
                <div className="contributor-bar-fill pri-fill" style={{ width: `${Math.max(2, Math.min(100, pri ?? 50))}%` }} />
              </div>
            </div>

            {/* RDT */}
            <div className="contributor-item">
              <div className="contributor-header">
                <span className="contributor-name">Accumulated Recovery Debt (RDT)</span>
                <span className={`contributor-tag ${rdtTagClass}`}>{rdtTag} ({rdt ?? 0}%)</span>
              </div>
              <div className="contributor-bar-track">
                <div className="contributor-bar-fill rdt-fill" style={{ width: `${Math.max(2, Math.min(100, rdt ?? 0))}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* External Environmental Context */}
      <div className="external-context-box">
        <div className="external-header">
          <div className="block-title">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41" />
            </svg>
            External Contextual Signals
          </div>
          <span className={`relevance-tag ${(externalContext?.relevance || 'low').toLowerCase().includes('low') ? 'low' : (externalContext?.relevance || '').toLowerCase().includes('potential') ? 'potential' : 'moderate'}`}>
            ● {externalContext?.relevance || 'Low Relevance'}
          </span>
        </div>

        <div className="external-cards-grid">
          {/* Weather */}
          <div className="external-card-item">
            <span className="external-card-label">Weather</span>
            <span className="external-card-val">
              {externalContext?.weather?.temperature || '24°C'} · {externalContext?.weather?.condition || 'Clear'}
            </span>
            <span className="external-card-status">Status: {externalContext?.weather?.status || 'Available'}</span>
          </div>

          {/* Air Quality */}
          <div className="external-card-item">
            <span className="external-card-label">Air Quality</span>
            <span className="external-card-val">
              {externalContext?.air_quality?.aqi ? `AQI ${externalContext.air_quality.aqi}` : 'AQI 42 (Moderate)'}
            </span>
            <span className="external-card-status">
              {externalContext?.air_quality?.status || 'WAQI Fallback Active'}
            </span>
          </div>

          {/* Environmental Events (GDACS) */}
          <div className="external-card-item">
            <span className="external-card-label">Environmental Events</span>
            <span className="external-card-val">
              {externalContext?.disasters?.active_count ? `${externalContext.disasters.active_count} Regional Advisory` : 'No Regional Disasters'}
            </span>
            <span className="external-card-status">GDACS Regional (&lt; 500 km)</span>
          </div>

          {/* Info Environment (NewsAPI) */}
          <div className="external-card-item">
            <span className="external-card-label">Information Signals</span>
            <span className="external-card-val">
              {externalContext?.news_alerts?.alert_count ? `${externalContext.news_alerts.alert_count} Alerts` : 'No Critical Alerts'}
            </span>
            <span className="external-card-status">NewsAPI Feed</span>
          </div>
        </div>

        <div className="external-disclaimer">
          <strong>Contextual Role:</strong> External environmental signals provide ambient context and are not direct measurements or proven causes of physiological stress.
        </div>
      </div>

      {/* Combined NIRA Interpretation */}
      <div className="nira-interpretation-banner">
        <div className="nira-interp-header">
          <div className="nira-interp-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            NIRA INTERPRETATION
          </div>
        </div>
        <p className="nira-interp-body">{niraInterpretationText}</p>
      </div>

      {/* Action Footer */}
      <div className="insight-action-footer">
        <div className="what-to-do-block">
          <div className="what-to-do-title">What Can I Do Now?</div>
          <div className="what-to-do-text">{whatCanIDoText}</div>
        </div>

        <div className="insight-button-group">
          <button 
            className="insight-secondary-btn"
            onClick={() => setShowDeltaDrawer(!showDeltaDrawer)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            {showDeltaDrawer ? 'Hide Comparison' : 'Why did my score change?'}
          </button>

          <button 
            className="insight-primary-btn"
            onClick={() => handleAskNIRA()}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Ask NIRA about this
          </button>
        </div>
      </div>

      {/* Comparative Delta Drawer */}
      {showDeltaDrawer && (
        <div className="delta-comparison-drawer">
          <div className="delta-drawer-header">
            <span className="delta-drawer-title">Comparative Telemetry Change Analysis</span>
            <button className="delta-close-btn" onClick={() => setShowDeltaDrawer(false)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="delta-metrics-grid">
            {/* NSRI Delta */}
            <div className="delta-metric-card">
              <div className="delta-metric-label">NSRI Composite</div>
              <div className="delta-metric-flow">
                {prevScore !== null ? `${prevScore} → ${score}` : `${score}`}
              </div>
              <span className={`delta-diff-pill ${scoreDelta > 0 ? 'up-stress' : scoreDelta < 0 ? 'down-stress' : ''}`}>
                {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta} pts
              </span>
            </div>

            {/* SAI Delta */}
            <div className="delta-metric-card">
              <div className="delta-metric-label">Physiological Load (SAI)</div>
              <div className="delta-metric-flow">
                {prevSai !== null ? `${prevSai} → ${sai}` : `${sai}`}
              </div>
              <span className={`delta-diff-pill ${saiDelta > 0 ? 'up-stress' : saiDelta < 0 ? 'down-stress' : ''}`}>
                {saiDelta > 0 ? `+${saiDelta}` : saiDelta}%
              </span>
            </div>

            {/* PRI Delta */}
            <div className="delta-metric-card">
              <div className="delta-metric-label">Recovery Capacity (PRI)</div>
              <div className="delta-metric-flow">
                {prevPri !== null ? `${prevPri} → ${pri}` : `${pri}`}
              </div>
              <span className={`delta-diff-pill ${priDelta > 0 ? 'up-recovery' : priDelta < 0 ? 'down-recovery' : ''}`}>
                {priDelta > 0 ? `+${priDelta}` : priDelta}%
              </span>
            </div>

            {/* RDT Delta */}
            <div className="delta-metric-card">
              <div className="delta-metric-label">Recovery Debt (RDT)</div>
              <div className="delta-metric-flow">
                {prevRdt !== null ? `${prevRdt} → ${rdt}` : `${rdt}`}
              </div>
              <span className={`delta-diff-pill ${rdtDelta > 0 ? 'up-stress' : rdtDelta < 0 ? 'down-stress' : ''}`}>
                {rdtDelta > 0 ? `+${rdtDelta}` : rdtDelta}%
              </span>
            </div>
          </div>

          <div className="delta-narrative-box">
            {deltaNarrative}
          </div>
        </div>
      )}
    </section>
  );
};

export default NIRAInsight;
