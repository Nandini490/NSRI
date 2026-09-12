import React, { useState, useEffect } from 'react';
import { createSnapshot, getSnapshots } from '../../services/snapshotService';
import './SnapshotsCard.css';

const formatSnapshotDate = (isoStr) => {
  if (!isoStr) return 'Just now';
  const d = new Date(isoStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' +
         d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getStateClass = (stateStr) => {
  return 'state-' + (stateStr || 'balanced').toLowerCase().replace(/\s+/g, '-');
};

const SnapshotsCard = ({ 
  currentNSRI = null, 
  onViewSnapshot = null, 
  onOpenCompare = null 
}) => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const loadSnapshotHistory = async () => {
    try {
      setLoading(true);
      const res = await getSnapshots();
      if (res && res.snapshots) {
        setSnapshots(res.snapshots);
      }
    } catch (err) {
      console.error('Failed to load snapshots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshotHistory();
  }, []);

  const handleSaveSnapshot = async () => {
    try {
      setSaving(true);

      // Extract current live state from active telemetry
      const score = currentNSRI ? Math.round(currentNSRI.nsri ?? currentNSRI.nsri_score ?? currentNSRI.composite_nsri ?? 0) : null;
      const state = currentNSRI ? (currentNSRI.state ?? currentNSRI.nsri_state ?? 'Balanced') : 'Balanced';
      const sai = currentNSRI ? Math.round(currentNSRI.sai ?? 0) : null;
      const pri = currentNSRI ? Math.round(currentNSRI.pri ?? 50) : null;
      const rdt = currentNSRI ? Math.round(currentNSRI.rdt ?? 0) : null;
      const hr = currentNSRI ? Math.round(currentNSRI.heart_rate ?? 70) : null;
      const hrv = currentNSRI ? Math.round(currentNSRI.hrv ?? 45) : null;
      const stressProb = currentNSRI ? (currentNSRI.stress_probability ?? 0.25) : null;
      const skinTemp = currentNSRI ? (currentNSRI.skin_temperature ?? 34.5) : null;
      const edaPeaks = currentNSRI ? (currentNSRI.eda_peaks ?? 2) : null;

      // Extract current NIRA insight text from DOM or dynamic generator
      const niraElem = document.querySelector('.nira-interp-body');
      const savedNira = niraElem ? niraElem.textContent.trim() : `NSRI is currently operating in ${state} mode with balanced physiological capacity.`;

      const guidanceElem = document.querySelector('.what-to-do-text');
      const savedGuidance = guidanceElem ? guidanceElem.textContent.trim() : 'Maintain normal pacing and regular hydration.';

      const payload = {
        title: `${state} Baseline`,
        scenario: state,
        nsri_score: score,
        nsri_state: state,
        sai,
        pri,
        rdt,
        heart_rate: hr,
        hrv,
        stress_probability: stressProb,
        skin_temperature: skinTemp,
        eda_peaks: edaPeaks,
        recovery_signal: score <= 20 ? 'Optimal' : score <= 40 ? 'Stable' : score <= 60 ? 'Declining' : 'Depleted',
        telemetry_source: 'Simulated Physiological Stream',
        data_quality: 'Optimal (98%)',
        nira_insight: savedNira,
        recovery_guidance: savedGuidance
      };

      const result = await createSnapshot(payload);
      await loadSnapshotHistory();

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setToastMessage(`Snapshot saved at ${timeStr}`);
      setTimeout(() => setToastMessage(null), 5000);

      // Trigger custom event if needed
      window.dispatchEvent(new CustomEvent('nsri-snapshot-saved', { detail: result.snapshot }));
    } catch (err) {
      console.error('Failed to save snapshot:', err);
      setToastMessage('Failed to save snapshot. Please try again.');
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Build SVG mini trend from chronological snapshots (reversed for chron order)
  const chronoSnapshots = [...snapshots].reverse();
  const maxTrendPoints = 12;
  const recentTrend = chronoSnapshots.slice(-maxTrendPoints);

  const chartWidth = 500;
  const chartHeight = 50;
  const points = recentTrend.map((s, idx) => {
    const x = recentTrend.length > 1 ? (idx / (recentTrend.length - 1)) * (chartWidth - 40) + 20 : chartWidth / 2;
    const score = s.nsri_score ?? 50;
    // Map 0-100 to y (lower score is better, top of chart)
    const y = chartHeight - ((score / 100) * (chartHeight - 16) + 8);
    return { x, y, score, state: s.nsri_state, time: formatSnapshotDate(s.created_at) };
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <section id="snapshots" className="glass-card section-full snapshots-card-container">
      {/* Header */}
      <div className="snapshots-header-row">
        <div className="snapshots-title-group">
          <div className="snapshots-badge-row">
            <span className="snapshots-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Autonomic Records
            </span>
            <span className="snapshots-count-pill">
              {snapshots.length} {snapshots.length === 1 ? 'Saved Snapshot' : 'Saved Snapshots'}
            </span>
          </div>
          <h3 className="snapshots-main-title">NSRI Snapshots & Reports</h3>
          <p className="snapshots-subtitle">
            Freeze and archive exact nervous-system states to track autonomic changes, compare moments, and export reports.
          </p>
        </div>

        <div className="snapshots-action-buttons">
          <button 
            className="snapshot-save-btn"
            onClick={handleSaveSnapshot}
            disabled={saving}
          >
            {saving ? (
              <>
                <svg className="spin-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Saving Snapshot...
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save Current Snapshot
              </>
            )}
          </button>

          <button 
            className="snapshot-compare-btn"
            onClick={() => onOpenCompare && onOpenCompare(snapshots[0]?.snapshot_id, snapshots[1]?.snapshot_id)}
            disabled={snapshots.length < 2}
            title={snapshots.length < 2 ? 'Save at least two snapshots to compare' : 'Compare two moments'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Compare Moments
          </button>
        </div>
      </div>

      {/* Confirmation Toast */}
      {toastMessage && (
        <div className="snapshot-toast-banner">
          <div className="toast-left">
            <svg className="toast-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{toastMessage}</span>
          </div>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>Immutable record archived</span>
        </div>
      )}

      {/* Optional Mini Trend Visualizer */}
      {recentTrend.length >= 2 && (
        <div className="snapshots-trend-container">
          <div className="trend-header-row">
            <span className="trend-title">Snapshot Score History ({recentTrend.length} Moments)</span>
            <div className="trend-legend">
              <span className="trend-legend-item"><span className="legend-dot balanced" /> 0-20 Balanced</span>
              <span className="trend-legend-item"><span className="legend-dot loaded" /> 20-40 Loaded</span>
              <span className="trend-legend-item"><span className="legend-dot strained" /> 40-60 Strained</span>
              <span className="trend-legend-item"><span className="legend-dot dysregulated" /> 60+ Elevated</span>
            </div>
          </div>

          <svg className="snapshots-mini-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            {/* Guide grid lines */}
            <line x1="0" y1="12" x2={chartWidth} y2="12" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="0" y1="28" x2={chartWidth} y2="28" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
            <line x1="0" y1="44" x2={chartWidth} y2="44" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

            {/* Connecting line */}
            <polyline 
              points={polylineStr} 
              fill="none" 
              stroke="var(--primary, #D98272)" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            {/* Data points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill={p.score <= 20 ? '#718774' : p.score <= 40 ? '#A8795D' : '#D98272'} 
                  stroke="#1A1918" 
                  strokeWidth="2" 
                />
              </g>
            ))}
          </svg>
        </div>
      )}

      {/* Snapshot Cards / Timeline */}
      {snapshots.length === 0 ? (
        <div className="snapshots-empty-state">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <p className="snapshots-empty-text">
            No snapshots recorded yet. Click <strong>"Save Current Snapshot"</strong> to archive your current nervous-system state, freeze NIRA insights, and generate clinical-grade wellness reports.
          </p>
        </div>
      ) : (
        <div className="snapshots-timeline-grid">
          {snapshots.map((snap) => {
            const score = Math.round(snap.nsri_score ?? 0);
            const state = snap.nsri_state || 'Balanced';
            const stateCls = getStateClass(state);

            return (
              <div 
                key={snap.snapshot_id} 
                className="snapshot-item-card"
                onClick={() => onViewSnapshot && onViewSnapshot(snap)}
              >
                <div className="snapshot-card-top">
                  <span className="snapshot-time-str">{formatSnapshotDate(snap.created_at)}</span>
                  <span className={`snapshot-state-badge ${stateCls}`}>{state}</span>
                </div>

                <div className="snapshot-card-main">
                  <span className="snapshot-score-val">{score}</span>
                  <span className="snapshot-title-text">{snap.title || `${state} State`}</span>
                </div>

                <div className="snapshot-metrics-chips">
                  <span className="snapshot-metric-chip">SAI<strong>{Math.round(snap.sai ?? 0)}</strong></span>
                  <span className="snapshot-metric-chip">PRI<strong>{Math.round(snap.pri ?? 50)}</strong></span>
                  <span className="snapshot-metric-chip">RDT<strong>{Math.round(snap.rdt ?? 0)}</strong></span>
                  {snap.heart_rate && (
                    <span className="snapshot-metric-chip">HR<strong>{Math.round(snap.heart_rate)}</strong></span>
                  )}
                </div>

                <div className="snapshot-card-footer">
                  <span>{snap.telemetry_source || 'Simulated Stream'}</span>
                  <span className="snapshot-card-click-hint">
                    View & Export Report →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SnapshotsCard;
