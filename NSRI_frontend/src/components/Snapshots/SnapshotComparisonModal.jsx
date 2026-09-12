import React, { useState, useEffect } from 'react';
import { compareSnapshots } from '../../services/snapshotService';
import './SnapshotComparisonModal.css';

const formatShortDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' +
         d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const SnapshotComparisonModal = ({ 
  initialIdA = null, 
  initialIdB = null, 
  snapshots = [], 
  onClose = null 
}) => {
  const [idA, setIdA] = useState(initialIdA || snapshots[1]?.snapshot_id || snapshots[0]?.snapshot_id);
  const [idB, setIdB] = useState(initialIdB || snapshots[0]?.snapshot_id);
  const [loading, setLoading] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (idA && idB && idA !== idB) {
      loadComparison(idA, idB);
    } else if (idA && idB && idA === idB) {
      // Same snapshot selected
      loadComparison(idA, idB);
    }
  }, [idA, idB]);

  const loadComparison = async (snapA, snapB) => {
    try {
      setLoading(true);
      setError(null);
      const res = await compareSnapshots(snapA, snapB);
      if (res && res.status === 'success') {
        setComparison(res);
      }
    } catch (err) {
      console.error('Comparison error:', err);
      setError('Unable to compare the selected snapshots.');
    } finally {
      setLoading(false);
    }
  };

  const snapA = comparison?.snapshot_a || snapshots.find(s => s.snapshot_id === idA);
  const snapB = comparison?.snapshot_b || snapshots.find(s => s.snapshot_id === idB);
  const deltas = comparison?.deltas || {};

  const scoreA = Math.round(snapA?.nsri_score ?? 0);
  const scoreB = Math.round(snapB?.nsri_score ?? 0);
  const deltaScore = deltas.nsri ?? (scoreB - scoreA);

  const saiA = Math.round(snapA?.sai ?? 0);
  const saiB = Math.round(snapB?.sai ?? 0);
  const deltaSai = deltas.sai ?? (saiB - saiA);

  const priA = Math.round(snapA?.pri ?? 50);
  const priB = Math.round(snapB?.pri ?? 50);
  const deltaPri = deltas.pri ?? (priB - priA);

  const rdtA = Math.round(snapA?.rdt ?? 0);
  const rdtB = Math.round(snapB?.rdt ?? 0);
  const deltaRdt = deltas.rdt ?? (rdtB - rdtA);

  const hrA = Math.round(snapA?.heart_rate ?? 70);
  const hrB = Math.round(snapB?.heart_rate ?? 70);
  const deltaHr = deltas.heart_rate ?? (hrB - hrA);

  const hrvA = Math.round(snapA?.hrv ?? 45);
  const hrvB = Math.round(snapB?.hrv ?? 45);
  const deltaHrv = deltas.hrv ?? (hrvB - hrvA);

  const narrative = comparison?.narrative || 'Comparative analysis computed between snapshots.';
  const niraInsight = comparison?.nira_comparison_insight || 'Compared with your earlier snapshot, your current state reflects notable autonomic adaptations across load and recovery dynamics.';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="snapshot-compare-overlay" onClick={onClose}>
      <div className="snapshot-compare-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="compare-header">
          <div className="compare-header-title">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <h3>COMPARE NSRI SNAPSHOTS</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="detail-export-btn" onClick={handlePrint}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export Comparison
            </button>
            <button className="detail-close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="compare-body">
          {/* Snapshot Selection Row */}
          <div className="compare-selectors-grid">
            <div className="selector-column">
              <span className="selector-label">Earlier Moment (Snapshot A)</span>
              <select 
                className="snapshot-select-dropdown"
                value={idA || ''} 
                onChange={(e) => setIdA(e.target.value)}
              >
                {snapshots.map(s => (
                  <option key={s.snapshot_id} value={s.snapshot_id}>
                    {s.title || s.nsri_state} ({formatShortDate(s.created_at)}) — Score {Math.round(s.nsri_score ?? 0)}
                  </option>
                ))}
              </select>
            </div>

            <div className="compare-vs-badge">VS</div>

            <div className="selector-column">
              <span className="selector-label">Comparison Moment (Snapshot B)</span>
              <select 
                className="snapshot-select-dropdown"
                value={idB || ''} 
                onChange={(e) => setIdB(e.target.value)}
              >
                {snapshots.map(s => (
                  <option key={s.snapshot_id} value={s.snapshot_id}>
                    {s.title || s.nsri_state} ({formatShortDate(s.created_at)}) — Score {Math.round(s.nsri_score ?? 0)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Side by Side Score Header Cards */}
          <div className="compare-side-by-side">
            {/* Snapshot A */}
            <div className="compare-moment-card">
              <span className="moment-card-tag">Snapshot A (Reference)</span>
              <div className="moment-score-row">
                <span className="moment-score-big" style={{ color: scoreA <= 20 ? '#718774' : scoreA <= 40 ? '#A8795D' : '#D98272' }}>
                  {scoreA}
                </span>
                <span className="moment-state-text">{snapA?.nsri_state || 'State A'}</span>
              </div>
              <div className="moment-time-meta">{formatShortDate(snapA?.created_at)}</div>
            </div>

            {/* Snapshot B */}
            <div className="compare-moment-card">
              <span className="moment-card-tag">Snapshot B (Comparison)</span>
              <div className="moment-score-row">
                <span className="moment-score-big" style={{ color: scoreB <= 20 ? '#718774' : scoreB <= 40 ? '#A8795D' : '#D98272' }}>
                  {scoreB}
                </span>
                <span className="moment-state-text">{snapB?.nsri_state || 'State B'}</span>
              </div>
              <div className="moment-time-meta">{formatShortDate(snapB?.created_at)}</div>
            </div>
          </div>

          {/* 6 Deltas Grid */}
          <div className="compare-deltas-grid">
            {/* NSRI Composite Delta */}
            <div className="delta-stat-card">
              <span className="delta-stat-title">NSRI Composite</span>
              <span className="delta-stat-flow">{scoreA} → {scoreB}</span>
              <span className={`delta-stat-diff ${deltaScore < 0 ? 'diff-better' : deltaScore > 0 ? 'diff-worse' : 'diff-neutral'}`}>
                {deltaScore < 0 ? `↓ ${Math.abs(deltaScore)} pts` : deltaScore > 0 ? `↑ +${deltaScore} pts` : '— 0 pts'}
              </span>
            </div>

            {/* SAI Delta */}
            <div className="delta-stat-card">
              <span className="delta-stat-title">Physiological Load (SAI)</span>
              <span className="delta-stat-flow">{saiA}% → {saiB}%</span>
              <span className={`delta-stat-diff ${deltaSai < 0 ? 'diff-better' : deltaSai > 0 ? 'diff-worse' : 'diff-neutral'}`}>
                {deltaSai < 0 ? `↓ ${Math.abs(deltaSai)}%` : deltaSai > 0 ? `↑ +${deltaSai}%` : '— 0%'}
              </span>
            </div>

            {/* PRI Delta */}
            <div className="delta-stat-card">
              <span className="delta-stat-title">Recovery Capacity (PRI)</span>
              <span className="delta-stat-flow">{priA}% → {priB}%</span>
              <span className={`delta-stat-diff ${deltaPri > 0 ? 'diff-better' : deltaPri < 0 ? 'diff-worse' : 'diff-neutral'}`}>
                {deltaPri > 0 ? `↑ +${deltaPri}%` : deltaPri < 0 ? `↓ ${Math.abs(deltaPri)}%` : '— 0%'}
              </span>
            </div>

            {/* RDT Delta */}
            <div className="delta-stat-card">
              <span className="delta-stat-title">Recovery Debt (RDT)</span>
              <span className="delta-stat-flow">{rdtA}% → {rdtB}%</span>
              <span className={`delta-stat-diff ${deltaRdt < 0 ? 'diff-better' : deltaRdt > 0 ? 'diff-worse' : 'diff-neutral'}`}>
                {deltaRdt < 0 ? `↓ ${Math.abs(deltaRdt)}%` : deltaRdt > 0 ? `↑ +${deltaRdt}%` : '— 0%'}
              </span>
            </div>

            {/* Heart Rate Delta */}
            <div className="delta-stat-card">
              <span className="delta-stat-title">Heart Rate</span>
              <span className="delta-stat-flow">{hrA} → {hrB} BPM</span>
              <span className={`delta-stat-diff ${deltaHr < 0 ? 'diff-better' : deltaHr > 0 ? 'diff-worse' : 'diff-neutral'}`}>
                {deltaHr < 0 ? `↓ ${Math.abs(deltaHr)} BPM` : deltaHr > 0 ? `↑ +${deltaHr} BPM` : '— 0'}
              </span>
            </div>

            {/* HRV Delta */}
            <div className="delta-stat-card">
              <span className="delta-stat-title">HRV (RMSSD)</span>
              <span className="delta-stat-flow">{hrvA} → {hrvB} ms</span>
              <span className={`delta-stat-diff ${deltaHrv > 0 ? 'diff-better' : deltaHrv < 0 ? 'diff-worse' : 'diff-neutral'}`}>
                {deltaHrv > 0 ? `↑ +${deltaHrv} ms` : deltaHrv < 0 ? `↓ ${Math.abs(deltaHrv)} ms` : '— 0'}
              </span>
            </div>
          </div>

          {/* "What changed?" Section */}
          <div className="compare-explanation-box">
            <div className="compare-block-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              What Changed?
            </div>
            <p className="compare-narrative-text">{narrative}</p>
          </div>

          {/* NIRA Comparison Insight Banner */}
          <div className="nira-comparison-banner">
            <div className="nira-comparison-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              NIRA Comparison Insight
            </div>
            <p className="nira-comparison-text">{niraInsight}</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="compare-footer">
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Comparing {snapA?.title || 'Snapshot A'} with {snapB?.title || 'Snapshot B'}
          </div>
          <button className="detail-export-btn" onClick={onClose}>
            Close Comparison
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SnapshotComparisonModal;
