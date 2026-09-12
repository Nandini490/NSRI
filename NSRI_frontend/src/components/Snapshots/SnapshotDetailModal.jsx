import React from 'react';
import './SnapshotDetailModal.css';

const formatDetailedDate = (isoStr) => {
  if (!isoStr) return 'Recorded Moment';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) +
         ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const getStateColor = (stateStr) => {
  const s = (stateStr || '').toLowerCase();
  if (s.includes('balance')) return '#718774';
  if (s.includes('load')) return '#A8795D';
  if (s.includes('strain')) return '#D98272';
  if (s.includes('dysreg')) return '#B9675D';
  return '#8E4A49';
};

const SnapshotDetailModal = ({ 
  snapshot = null, 
  onClose = null, 
  onOpenCompare = null, 
  onDeleteSnapshot = null 
}) => {
  if (!snapshot) return null;

  const score = Math.round(snapshot.nsri_score ?? 0);
  const state = snapshot.nsri_state || 'Balanced';
  const stateColor = getStateColor(state);

  const sai = Math.round(snapshot.sai ?? 0);
  const pri = Math.round(snapshot.pri ?? 50);
  const rdt = Math.round(snapshot.rdt ?? 0);

  const hr = snapshot.heart_rate ? Math.round(snapshot.heart_rate) : 72;
  const hrv = snapshot.hrv ? Math.round(snapshot.hrv) : 48;
  const stressSignal = snapshot.stress_probability ? Math.round(snapshot.stress_probability * 100) : 24;
  const skinTemp = snapshot.skin_temperature ? snapshot.skin_temperature.toFixed(1) : '34.6';
  const edaPeaks = snapshot.eda_peaks !== undefined && snapshot.eda_peaks !== null ? Math.round(snapshot.eda_peaks) : 3;

  const recoverySignal = snapshot.recovery_signal || (score <= 30 ? 'Improving' : score <= 60 ? 'Stable' : 'Declining');
  const recoveryGuidance = snapshot.recovery_guidance || 'Maintain steady pacing, regular hydration, and scheduled restorative downtime.';

  const extContext = snapshot.external_context || {};
  const weatherText = extContext.weather ? `${extContext.weather.temperature || '24°C'} · ${extContext.weather.condition || 'Clear'}` : '24°C · Clear';
  const aqiText = extContext.air_quality ? (extContext.air_quality.aqi ? `AQI ${extContext.air_quality.aqi}` : 'AQI 42 (Moderate)') : 'AQI 42';
  const disasterText = extContext.disasters?.active_count ? `${extContext.disasters.active_count} Regional Advisory` : 'None';
  const newsText = extContext.news_alerts?.alert_count ? `${extContext.news_alerts.alert_count} Alerts` : 'None';

  const niraInsight = snapshot.nira_insight || 'Your autonomic nervous system state exhibits balanced physiological reserves and responsive recovery capacity.';

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="snapshot-detail-overlay" onClick={onClose}>
      <div className="snapshot-detail-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="snapshot-detail-header">
          <div className="detail-header-left">
            <div className="detail-logo-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="detail-title-group">
              <h3>NSRI SNAPSHOT REPORT</h3>
              <div className="detail-timestamp-str">{formatDetailedDate(snapshot.created_at)}</div>
            </div>
          </div>

          <div className="detail-header-actions">
            <button className="detail-export-btn" onClick={handleExportPDF} title="Export professional PDF report">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Report (PDF)
            </button>

            <button className="detail-close-btn" onClick={onClose} aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="snapshot-detail-body">
          {/* Main Score Banner */}
          <div className="detail-score-banner">
            <div className="detail-score-left">
              <div className="detail-score-box">
                <span className="detail-score-number" style={{ color: stateColor }}>{score}</span>
                <span className="detail-score-denom">NSRI</span>
              </div>
              <div className="detail-state-info">
                <h4 style={{ color: stateColor }}>{state}</h4>
                <p>{snapshot.title || 'Frozen Physiological Snapshot'}</p>
              </div>
            </div>

            <div className="detail-score-meta" style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div>Source: <strong>{snapshot.telemetry_source || 'Simulated Stream'}</strong></div>
              <div style={{ marginTop: '4px' }}>Data Quality: <strong style={{ color: '#718774' }}>{snapshot.data_quality || 'Optimal (98%)'}</strong></div>
            </div>
          </div>

          {/* Metric Trio: SAI, PRI, RDT */}
          <div className="detail-trio-grid">
            <div className="detail-trio-card">
              <span className="detail-trio-label">Stress Accumulation (SAI)</span>
              <span className="detail-trio-val">{sai}%</span>
              <span className="detail-trio-desc">Acute physiological load</span>
            </div>

            <div className="detail-trio-card">
              <span className="detail-trio-label">Recovery Capacity (PRI)</span>
              <span className="detail-trio-val" style={{ color: '#718774' }}>{pri}%</span>
              <span className="detail-trio-desc">Parasympathetic reserves</span>
            </div>

            <div className="detail-trio-card">
              <span className="detail-trio-label">Recovery Debt (RDT)</span>
              <span className="detail-trio-val" style={{ color: '#D98272' }}>{rdt}%</span>
              <span className="detail-trio-desc">Longitudinal deficit</span>
            </div>
          </div>

          {/* Physiological Signals */}
          <div className="detail-section-block">
            <div className="detail-section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Physiological Signals
            </div>

            <div className="detail-physio-grid">
              <div className="physio-stat-item">
                <span className="physio-stat-label">Heart Rate</span>
                <div className="physio-stat-val">{hr} BPM</div>
              </div>
              <div className="physio-stat-item">
                <span className="physio-stat-label">HRV (RMSSD)</span>
                <div className="physio-stat-val">{hrv} ms</div>
              </div>
              <div className="physio-stat-item">
                <span className="physio-stat-label">Stress Signal</span>
                <div className="physio-stat-val">{stressSignal}%</div>
              </div>
              <div className="physio-stat-item">
                <span className="physio-stat-label">Skin Temperature</span>
                <div className="physio-stat-val">{skinTemp}°C</div>
              </div>
              <div className="physio-stat-item">
                <span className="physio-stat-label">EDA Peaks</span>
                <div className="physio-stat-val">{edaPeaks}</div>
              </div>
            </div>
          </div>

          {/* Recovery Dynamics & Guidance */}
          <div className="detail-section-block">
            <div className="detail-section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              Recovery Dynamics & Guidance
            </div>

            <div className="detail-recovery-content">
              <div className="detail-recovery-signal-row">
                <span>Recovery Trajectory Signal:</span>
                <strong style={{ color: recoverySignal === 'Improving' ? '#718774' : recoverySignal === 'Declining' ? '#D98272' : 'var(--text-primary)' }}>
                  {recoverySignal}
                </strong>
              </div>

              <div className="detail-guidance-box">
                {recoveryGuidance}
              </div>
            </div>
          </div>

          {/* Environmental Context */}
          <div className="detail-section-block">
            <div className="detail-section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41" />
              </svg>
              Environmental Context (Ambient Conditions)
            </div>

            <div className="detail-env-grid">
              <div className="detail-env-card">
                <span className="detail-env-label">Weather</span>
                <div className="detail-env-val">{weatherText}</div>
              </div>
              <div className="detail-env-card">
                <span className="detail-env-label">Air Quality</span>
                <div className="detail-env-val">{aqiText}</div>
              </div>
              <div className="detail-env-card">
                <span className="detail-env-label">Regional Alerts</span>
                <div className="detail-env-val">{disasterText}</div>
              </div>
              <div className="detail-env-card">
                <span className="detail-env-label">Information Signals</span>
                <div className="detail-env-val">{newsText}</div>
              </div>
            </div>

            <div className="detail-env-disclaimer">
              "Contextual environmental signals — not direct measures of physiological stress."
            </div>
          </div>

          {/* NIRA Insight */}
          <div className="detail-section-block">
            <div className="detail-section-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              NIRA Insight (Frozen at Capture)
            </div>

            <div className="detail-nira-box">
              <p className="detail-nira-text">{niraInsight}</p>
            </div>
          </div>

          {/* Non-Clinical Disclaimer */}
          <div className="detail-footer-disclaimer">
            <strong>Non-Clinical Scope:</strong> NSRI is a non-clinical wellness and monitoring system. Its outputs are intended to help users understand patterns in physiological load and recovery dynamics and are not medical diagnoses.
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="snapshot-detail-footer">
          <div className="footer-left-actions">
            {onDeleteSnapshot && (
              <button 
                className="detail-delete-btn"
                onClick={() => onDeleteSnapshot(snapshot.snapshot_id)}
              >
                Delete Snapshot
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {onOpenCompare && (
              <button 
                className="detail-compare-btn"
                onClick={() => onOpenCompare(snapshot.snapshot_id)}
              >
                Compare with Another Moment →
              </button>
            )}
            <button className="detail-export-btn" onClick={onClose}>
              Done
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SnapshotDetailModal;
