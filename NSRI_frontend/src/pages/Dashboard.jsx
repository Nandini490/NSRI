import React, { useState, useEffect, useCallback } from 'react';
import DashboardNav from '../components/DashboardNav';
import CurrentStateHero from '../components/CurrentStateHero';
import LiveSignals from '../components/LiveSignals';
import NIRAInsight from '../components/NIRAInsight/NIRAInsight';
import CoreSignals from '../components/CoreSignals';
import ScoreBreakdown from '../components/ScoreBreakdown';
import RecoveryGuidance from '../components/RecoveryGuidance';
import RecoveryTrend from '../components/RecoveryTrend';
import MeasurementInput from '../components/MeasurementInput';
import AIChat from '../components/AIChat/AIChat';
import History from '../components/History';
import HowItWorksModal from '../components/HowItWorksModal';
import { fetchDashboardData } from '../services/dashboardService';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({ nsri_data: null, previous_nsri_data: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMonitoringActive, setIsMonitoringActive] = useState(true);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState('Just now');

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

  useEffect(() => {
    loadData();
  }, [loadData]);

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

          {/* Section 4: Core NSRI Indicators (SAI, PRI, RDT) */}
          {hasData && <CoreSignals data={currentNSRI} />}

          {/* Section 5: Score Drivers & Environmental Context */}
          {hasData && <ScoreBreakdown data={currentNSRI} />}

          {/* Section 5: Personalized Recovery Guidance */}
          {hasData && <RecoveryGuidance data={currentNSRI} />}

          {/* Section 6: Recovery Trajectory Curve */}
          <RecoveryTrend currentData={currentNSRI} />

          {/* Section 7: Live Wearable Simulation & 24-Hour Timeline */}
          <MeasurementInput onMeasurementSaved={loadData} />

          {/* Section 8: NIRA (Nervous-system Intelligence & Recovery Assistant) */}
          <div id="nira-assistant" className="glass-card section-full" style={{ padding: '0', overflow: 'hidden' }}>
            <AIChat nsriData={currentNSRI} />
          </div>

          {/* Section 9: 7-Day History Logs */}
          <div id="history" className="section-full">
            <History />
          </div>
        </div>
      </main>

      {/* Technical Deep Dive Modal for Judges */}
      <HowItWorksModal 
        isOpen={isHowItWorksOpen} 
        onClose={() => setIsHowItWorksOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
