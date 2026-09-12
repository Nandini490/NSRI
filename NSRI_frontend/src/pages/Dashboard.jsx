import React, { useState, useEffect, useCallback } from 'react';
import DashboardNav from '../components/DashboardNav';
import CurrentStateHero from '../components/CurrentStateHero';
import LiveSignals from '../components/LiveSignals';
import NIRAInsight from '../components/NIRAInsight/NIRAInsight';
import SnapshotsCard from '../components/Snapshots/SnapshotsCard';
import SnapshotDetailModal from '../components/Snapshots/SnapshotDetailModal';
import SnapshotComparisonModal from '../components/Snapshots/SnapshotComparisonModal';
import CoreSignals from '../components/CoreSignals';
import ScoreBreakdown from '../components/ScoreBreakdown';
import RecoveryGuidance from '../components/RecoveryGuidance';
import RecoveryTrend from '../components/RecoveryTrend';
import MeasurementInput from '../components/MeasurementInput';
import AIChat from '../components/AIChat/AIChat';
import History from '../components/History';
import HowItWorksModal from '../components/HowItWorksModal';
import { fetchDashboardData } from '../services/dashboardService';
import { getSnapshots, createSnapshot, deleteSnapshot } from '../services/snapshotService';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({ nsri_data: null, previous_nsri_data: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState('Just now');

  // Snapshot State Management
  const [snapshots, setSnapshots] = useState([]);
  const [activeSnapshotDetail, setActiveSnapshotDetail] = useState(null);
  const [compareModal, setCompareModal] = useState({ isOpen: false, idA: null, idB: null });
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerSavedToast, setHeaderSavedToast] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
      setLastUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.message !== 'Authentication expired') {
        setError("We couldn't load your NSRI telemetry. Please ensure the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSnapshots = useCallback(async () => {
    try {
      const res = await getSnapshots();
      if (res && res.snapshots) {
        setSnapshots(res.snapshots);
      }
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    refreshSnapshots();
  }, [loadData, refreshSnapshots]);

  // Periodic subtle live sync when monitoring is active
  useEffect(() => {
    if (!isMonitoringActive) return;
    const interval = setInterval(() => {
      loadData();
    }, 12000);
    return () => clearInterval(interval);
  }, [isMonitoringActive, loadData]);

  const hasData = dashboardData && dashboardData.nsri_data;
  const currentNSRI = hasData ? dashboardData.nsri_data : null;
  const previousNSRI = dashboardData?.previous_nsri_data;

  // Header quick save snapshot handler
  const handleHeaderSaveSnapshot = async () => {
    try {
      setHeaderSaving(true);
      const score = currentNSRI ? Math.round(currentNSRI.nsri ?? currentNSRI.nsri_score ?? currentNSRI.composite_nsri ?? 0) : null;
      const state = currentNSRI ? (currentNSRI.state ?? currentNSRI.nsri_state ?? 'Balanced') : 'Balanced';
      const sai = currentNSRI ? Math.round(currentNSRI.sai ?? 0) : null;
      const pri = currentNSRI ? Math.round(currentNSRI.pri ?? 50) : null;
      const rdt = currentNSRI ? Math.round(currentNSRI.rdt ?? 0) : null;
      const hr = currentNSRI ? Math.round(currentNSRI.heart_rate ?? 70) : null;
      const hrv = currentNSRI ? Math.round(currentNSRI.hrv ?? 45) : null;

      const niraElem = document.querySelector('.nira-interp-body');
      const savedNira = niraElem ? niraElem.textContent.trim() : `Current autonomic state is ${state} with responsive recovery reserves.`;

      const guidanceElem = document.querySelector('.what-to-do-text');
      const savedGuidance = guidanceElem ? guidanceElem.textContent.trim() : 'Maintain scheduled recovery periods and regular hydration.';

      const payload = {
        title: `${state} Snapshot`,
        scenario: state,
        nsri_score: score,
        nsri_state: state,
        sai,
        pri,
        rdt,
        heart_rate: hr,
        hrv,
        stress_probability: currentNSRI?.stress_probability ?? 0.25,
        skin_temperature: currentNSRI?.skin_temperature ?? 34.5,
        eda_peaks: currentNSRI?.eda_peaks ?? 2,
        recovery_signal: score <= 20 ? 'Optimal' : score <= 40 ? 'Stable' : score <= 60 ? 'Declining' : 'Depleted',
        telemetry_source: 'Simulated Physiological Stream',
        data_quality: 'Optimal (98%)',
        nira_insight: savedNira,
        recovery_guidance: savedGuidance
      };

      const res = await createSnapshot(payload);
      await refreshSnapshots();
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setHeaderSavedToast(`Snapshot saved at ${timeStr}`);
      setTimeout(() => setHeaderSavedToast(null), 4000);
      if (res && res.snapshot) {
        setActiveSnapshotDetail(res.snapshot);
      }
    } catch (err) {
      console.error('Error saving snapshot:', err);
    } finally {
      setHeaderSaving(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId) => {
    try {
      await deleteSnapshot(snapshotId);
      setActiveSnapshotDetail(null);
      await refreshSnapshots();
    } catch (err) {
      console.error('Failed to delete snapshot:', err);
    }
  };

  const handleOpenCompare = (idA = null, idB = null) => {
    setActiveSnapshotDetail(null);
    setCompareModal({
      isOpen: true,
      idA: idA || snapshots[1]?.snapshot_id || snapshots[0]?.snapshot_id,
      idB: idB || snapshots[0]?.snapshot_id
    });
  };

  return (
    <div className="dashboard-layout">
      <DashboardNav onOpenHowItWorks={() => setIsHowItWorksOpen(true)} />
      
      <main className="dashboard-main">
        {/* Top Monitoring Header / Status Bar */}
        <header className="dashboard-monitoring-header">
          <div className="header-status-left">
            <div className="monitoring-status-pill">
              <span className={`monitoring-dot ${isMonitoringActive ? 'active' : 'paused'}`}></span>
              <span className="monitoring-label">
                {isMonitoringActive ? 'Monitoring Active' : 'Monitoring Paused'}
              </span>
            </div>

            <button 
              className="monitoring-toggle-btn"
              onClick={() => setIsMonitoringActive(!isMonitoringActive)}
            >
              {isMonitoringActive ? 'Pause Stream' : 'Resume Stream'}
            </button>

            <button 
              className="snapshot-save-header-btn"
              onClick={handleHeaderSaveSnapshot}
              disabled={headerSaving || !hasData}
              title="Freeze and save current state to MongoDB"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(217, 130, 114, 0.15)',
                color: 'var(--primary, #D98272)',
                border: '1px solid rgba(217, 130, 114, 0.3)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {headerSaving ? 'Saving...' : 'Save Snapshot'}
            </button>

            {headerSavedToast && (
              <span style={{ fontSize: '12px', color: '#718774', fontWeight: '500' }}>
                ✓ {headerSavedToast}
              </span>
            )}
          </div>

          <div className="header-telemetry-meta">
            <span className="meta-item">Last Sync: <strong>{lastUpdateTime}</strong></span>
            <span className="meta-divider">•</span>
            <span className="meta-item">Source: <strong>Simulated Physiological Stream</strong></span>
            <span className="meta-divider">•</span>
            <span className="meta-item">Quality: <strong className="quality-optimal">Optimal (98%)</strong></span>
          </div>
        </header>

        {error && (
          <div className="error-message" style={{ marginBottom: '24px' }}>{error}</div>
        )}

        <div className="dashboard-grid">
          {/* Section 1: Hero Current State */}
          {loading ? (
            <div className="section-full glass-card" style={{ padding: '48px', textAlign: 'center' }}>
              <div className="spinner-loader"></div>
              <p className="placeholder-text" style={{ marginTop: '16px' }}>Synchronizing nervous system telemetry...</p>
            </div>
          ) : !hasData ? (
            <div className="section-full glass-card empty-state-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="empty-icon-wrapper">
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '14px' }}>
                Connecting to Wearable Stream
              </h3>
              <p className="placeholder-text" style={{ maxWidth: '520px', margin: '8px auto 20px', fontSize: '14px' }}>
                Select a monitoring scenario below to stream simulated biosensor telemetry and calculate real-time NSRI recovery indices.
              </p>
            </div>
          ) : (
            <CurrentStateHero data={currentNSRI} previousData={previousNSRI} />
          )}

          {/* Section 2: Live Biosensor Signals */}
          {hasData && <LiveSignals data={currentNSRI} isMonitoringActive={isMonitoringActive} />}

          {/* Section 3: NIRA Insight (Continuous Interpretation Layer) */}
          <NIRAInsight data={currentNSRI} previousData={previousNSRI} />

          {/* Section 4: NSRI Snapshots & Reports (Freeze, Compare & Export) */}
          <SnapshotsCard 
            currentNSRI={currentNSRI} 
            onViewSnapshot={(snap) => setActiveSnapshotDetail(snap)}
            onOpenCompare={(idA, idB) => handleOpenCompare(idA, idB)}
          />

          {/* Section 5: Core NSRI Indicators (SAI, PRI, RDT) */}
          {hasData && <CoreSignals data={currentNSRI} />}

          {/* Section 6: Score Drivers & Environmental Context */}
          {hasData && <ScoreBreakdown data={currentNSRI} />}

          {/* Section 7: Personalized Recovery Guidance */}
          {hasData && <RecoveryGuidance data={currentNSRI} />}

          {/* Section 8: Recovery Trajectory Curve */}
          <RecoveryTrend currentData={currentNSRI} />

          {/* Section 9: Live Wearable Simulation & 24-Hour Timeline */}
          <MeasurementInput onMeasurementSaved={() => { loadData(); refreshSnapshots(); }} />

          {/* Section 10: NIRA (Nervous-system Intelligence & Recovery Assistant) */}
          <div id="nira-assistant" className="glass-card section-full" style={{ padding: '0', overflow: 'hidden' }}>
            <AIChat nsriData={currentNSRI} />
          </div>

          {/* Section 11: 7-Day History Logs */}
          <div id="history" className="section-full">
            <History />
          </div>
        </div>
      </main>

      {/* Snapshot Detail & PDF Export Modal */}
      {activeSnapshotDetail && (
        <SnapshotDetailModal 
          snapshot={activeSnapshotDetail}
          onClose={() => setActiveSnapshotDetail(null)}
          onOpenCompare={(id) => handleOpenCompare(id, null)}
          onDeleteSnapshot={handleDeleteSnapshot}
        />
      )}

      {/* Snapshot Comparison Modal */}
      {compareModal.isOpen && (
        <SnapshotComparisonModal 
          initialIdA={compareModal.idA}
          initialIdB={compareModal.idB}
          snapshots={snapshots}
          onClose={() => setCompareModal({ isOpen: false, idA: null, idB: null })}
        />
      )}

      {/* Technical Deep Dive Modal for Judges */}
      <HowItWorksModal 
        isOpen={isHowItWorksOpen} 
        onClose={() => setIsHowItWorksOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;

