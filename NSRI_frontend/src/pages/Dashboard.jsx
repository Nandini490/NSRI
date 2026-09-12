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

const DEFAULT_SIMULATED_BASELINE = {
  nsri: 28,
  state: 'Balanced',
  sai: 22,
  pri: 78,
  rdt: 15,
  heart_rate: 68,
  hrv: 65,
  Temp_Mean: 33.2,
  SCR_Peaks_N: 1,
  stress_probability: 0.22,
  skin_temperature: 33.2,
  eda_peaks: 1,
  recovery_signal: 'Optimal',
  composite_nsri: 28
};

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

  // Auto-start simulated baseline telemetry stream if no prior measurement exists
  const autoStartSimulatedStream = useCallback(async () => {
    try {
      const token = localStorage.getItem('nsri_token');
      if (!token) return;

      const scenario = {
        wesad: {
          Mean_RR: 0.88, Mean_HR: 68, SDNN: 75, RMSSD: 65, pNN50: 35,
          SCR_Peaks_N: 1, SCR_Peaks_Amplitude_Mean: 0.1, EDA_Tonic_SD: 0.08,
          Resp_Rate_Mean: 14, Resp_Rate_Std: 1.2, Resp_Amplitude_Std: 1.0,
          Temp_Mean: 33.2, Temp_Std: 0.05, Temp_Min: 33.1, Temp_Max: 33.3,
          ACC_Magnitude_Mean: 1.0, ACC_Magnitude_Std: 0.1, ACC_Magnitude_Max: 1.2
        },
        hrv_normalized: 0.85,
        resting_hr_normalized: 0.25
      };
      const measurement_id = `telemetry-${Date.now()}`;

      // 1. WESAD ML Inference
      const wesadRes = await fetch('/api/v1/predict/wesad', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...scenario.wesad, measurement_id })
      });
      const wesadData = wesadRes.ok ? await wesadRes.json() : null;

      // 2. MMASH ML Inference
      const mmashRes = await fetch('/api/v1/predict/mmash', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mean_hr: scenario.wesad.Mean_HR,
          sdnn: scenario.wesad.SDNN,
          rmssd: scenario.wesad.RMSSD,
          measurement_id
        })
      });
      const mmashData = mmashRes.ok ? await mmashRes.json() : null;

      // 3. Stateful NSRI Calculation Engine
      await fetch('/api/v1/nsri/calculate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wesad_stress_probability: wesadData?.probability_class_1 ?? wesadData?.stress_probability ?? 0.22,
          mmash_stress_probability: mmashData?.probability_class_1 ?? mmashData?.stress_probability ?? 0.20,
          hrv_normalized: scenario.hrv_normalized,
          resting_hr_normalized: scenario.resting_hr_normalized,
          external_stress_score: 12.0,
          measurement_id
        })
      });

      const freshData = await fetchDashboardData();
      setDashboardData(freshData);
      setLastUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Auto-start simulated stream non-blocking error:', e);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDashboardData();
      if (!data || !data.nsri_data) {
        // Automatically start simulated stream in database
        await autoStartSimulatedStream();
      } else {
        setDashboardData(data);
        setLastUpdateTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      if (err.message !== 'Authentication expired') {
        setError("We couldn't load your NSRI telemetry. Please ensure the backend server is running.");
      }
    } finally {
      setLoading(false);
    }
  }, [autoStartSimulatedStream]);

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

  // Periodic live sync when monitoring is active
  useEffect(() => {
    if (!isMonitoringActive) return;
    const interval = setInterval(() => {
      loadData();
    }, 12000);
    return () => clearInterval(interval);
  }, [isMonitoringActive, loadData]);

  const hasData = Boolean(dashboardData && dashboardData.nsri_data);
  const currentNSRI = dashboardData?.nsri_data || DEFAULT_SIMULATED_BASELINE;
  const previousNSRI = dashboardData?.previous_nsri_data;

  // Header quick save snapshot handler
  const handleHeaderSaveSnapshot = async () => {
    try {
      setHeaderSaving(true);
      const score = Math.round(currentNSRI.nsri ?? currentNSRI.nsri_score ?? currentNSRI.composite_nsri ?? 28);
      const state = currentNSRI.state ?? currentNSRI.nsri_state ?? 'Balanced';
      const sai = Math.round(currentNSRI.sai ?? 22);
      const pri = Math.round(currentNSRI.pri ?? 78);
      const rdt = Math.round(currentNSRI.rdt ?? 15);
      const hr = Math.round(currentNSRI.heart_rate ?? currentNSRI.Mean_HR ?? 68);
      const hrv = Math.round(currentNSRI.hrv ?? currentNSRI.RMSSD ?? 65);

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
        stress_probability: currentNSRI?.stress_probability ?? 0.22,
        skin_temperature: currentNSRI?.skin_temperature ?? currentNSRI?.Temp_Mean ?? 33.2,
        eda_peaks: currentNSRI?.eda_peaks ?? currentNSRI?.SCR_Peaks_N ?? 1,
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
              disabled={headerSaving}
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
          <CurrentStateHero data={currentNSRI} previousData={previousNSRI} />

          {/* Section 2: Live Biosensor Signals */}
          <LiveSignals data={currentNSRI} isMonitoringActive={isMonitoringActive} />

          {/* Section 3: NIRA Insight (Continuous Interpretation Layer) */}
          <NIRAInsight data={currentNSRI} previousData={previousNSRI} />

          {/* Section 4: NSRI Snapshots & Reports (Freeze, Compare & Export) */}
          <SnapshotsCard 
            currentNSRI={currentNSRI} 
            onViewSnapshot={(snap) => setActiveSnapshotDetail(snap)}
            onOpenCompare={(idA, idB) => handleOpenCompare(idA, idB)}
          />

          {/* Section 5: Core NSRI Indicators (SAI, PRI, RDT) */}
          <CoreSignals data={currentNSRI} />

          {/* Section 6: Score Drivers & Environmental Context */}
          <ScoreBreakdown data={currentNSRI} />

          {/* Section 7: Personalized Recovery Guidance */}
          <RecoveryGuidance data={currentNSRI} />

          {/* Section 8: Recovery Trajectory Curve */}
          <RecoveryTrend currentData={currentNSRI} />

          {/* Section 9: Live Physiological Simulation & 24-Hour Timeline */}
          <MeasurementInput onMeasurementSaved={() => { loadData(); refreshSnapshots(); }} />

          {/* Section 10: NIRA (Nervous-system Intelligence & Recovery Assistant) */}
          <div id="nira-assistant" className="glass-card section-full" style={{ padding: '0', overflow: 'hidden' }}>
            <AIChat nsriData={currentNSRI} onSnapshotSaved={refreshSnapshots} />
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

