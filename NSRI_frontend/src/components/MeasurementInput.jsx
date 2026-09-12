import React, { useState, useEffect, useRef } from 'react';
import '../styles/Dashboard.css';

const SCENARIOS = {
  'Balanced': {
    label: 'Balanced Baseline',
    desc: 'Resting HR 68 bpm, High HRV 65 ms, Low EDA 1 peak',
    badge: 'Restful Equilibrium',
    badgeClass: 'badge-balanced',
    wesad: {
      Mean_RR: 0.88, Mean_HR: 68, SDNN: 75, RMSSD: 65, pNN50: 35,
      SCR_Peaks_N: 1, SCR_Peaks_Amplitude_Mean: 0.1, EDA_Tonic_SD: 0.08,
      Resp_Rate_Mean: 14, Resp_Rate_Std: 1.2, Resp_Amplitude_Std: 1.0,
      Temp_Mean: 33.2, Temp_Std: 0.05, Temp_Min: 33.1, Temp_Max: 33.3,
      ACC_Magnitude_Mean: 1.0, ACC_Magnitude_Std: 0.1, ACC_Magnitude_Max: 1.2
    },
    hrv_normalized: 0.85,
    resting_hr_normalized: 0.25
  },
  'High Stress': {
    label: 'High Stress Workday',
    desc: 'Elevated HR 105 bpm, Suppressed HRV 18 ms, High EDA 14 peaks',
    badge: 'Sympathetic Load',
    badgeClass: 'badge-strained',
    wesad: {
      Mean_RR: 0.57, Mean_HR: 105, SDNN: 22, RMSSD: 18, pNN50: 2,
      SCR_Peaks_N: 14, SCR_Peaks_Amplitude_Mean: 1.1, EDA_Tonic_SD: 0.75,
      Resp_Rate_Mean: 23, Resp_Rate_Std: 3.2, Resp_Amplitude_Std: 1.9,
      Temp_Mean: 34.4, Temp_Std: 0.28, Temp_Min: 34.0, Temp_Max: 34.9,
      ACC_Magnitude_Mean: 1.2, ACC_Magnitude_Std: 0.25, ACC_Magnitude_Max: 2.2
    },
    hrv_normalized: 0.22,
    resting_hr_normalized: 0.82
  },
  'Recovery': {
    label: 'Rest & Recovery Protocol',
    desc: 'Deep resting HR 58 bpm, Peak HRV 85 ms, Calm EDA 0 peaks',
    badge: 'Parasympathetic Replenishment',
    badgeClass: 'badge-recovery',
    wesad: {
      Mean_RR: 1.03, Mean_HR: 58, SDNN: 95, RMSSD: 85, pNN50: 50,
      SCR_Peaks_N: 0, SCR_Peaks_Amplitude_Mean: 0.0, EDA_Tonic_SD: 0.04,
      Resp_Rate_Mean: 11, Resp_Rate_Std: 0.8, Resp_Amplitude_Std: 0.9,
      Temp_Mean: 32.4, Temp_Std: 0.02, Temp_Min: 32.3, Temp_Max: 32.5,
      ACC_Magnitude_Mean: 0.9, ACC_Magnitude_Std: 0.04, ACC_Magnitude_Max: 0.98
    },
    hrv_normalized: 0.95,
    resting_hr_normalized: 0.15
  },
  'Exhausted': {
    label: 'Acute Overload & Debt',
    desc: 'Elevated baseline HR 96 bpm, Low HRV 22 ms, High Debt',
    badge: 'Autonomic Depletion',
    badgeClass: 'badge-exhausted',
    wesad: {
      Mean_RR: 0.62, Mean_HR: 96, SDNN: 28, RMSSD: 22, pNN50: 4,
      SCR_Peaks_N: 9, SCR_Peaks_Amplitude_Mean: 0.45, EDA_Tonic_SD: 0.3,
      Resp_Rate_Mean: 21, Resp_Rate_Std: 1.8, Resp_Amplitude_Std: 1.3,
      Temp_Mean: 34.1, Temp_Std: 0.15, Temp_Min: 33.9, Temp_Max: 34.3,
      ACC_Magnitude_Mean: 1.05, ACC_Magnitude_Std: 0.12, ACC_Magnitude_Max: 1.4
    },
    hrv_normalized: 0.28,
    resting_hr_normalized: 0.75
  }
};

const TIMELINE_STEPS = [
  { time: "08:00", name: "Morning Awakening", scenario: "Balanced", note: "Restful morning baseline, high vagal tone" },
  { time: "11:00", name: "Focus & Execution", scenario: "Balanced", note: "Productive engagement, stable recovery" },
  { time: "14:00", name: "Midday Surge", scenario: "High Stress", note: "Elevated workload, acute sympathetic spike" },
  { time: "17:00", name: "Sustained Pressure", scenario: "High Stress", note: "Extended cognitive strain, debt accumulating" },
  { time: "20:00", name: "Evening Reset", scenario: "Recovery", note: "Down-regulation, parasympathetic reactivation" },
  { time: "23:00", name: "Overnight Rest", scenario: "Recovery", note: "Deep sleep, clearance of accumulated debt" }
];

const MeasurementInput = ({ onMeasurementSaved }) => {
  const [activeTab, setActiveTab] = useState('scenarios'); // 'scenarios' | 'timeline'
  const [selectedScenario, setSelectedScenario] = useState('Balanced');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [error, setError] = useState(null);

  // Timeline Replay State
  const [replayIndex, setReplayIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const autoPlayTimer = useRef(null);

  const executePipeline = async (scenarioKey) => {
    const token = localStorage.getItem('nsri_token');
    if (!token) throw new Error("Not authenticated");

    const scenario = SCENARIOS[scenarioKey];
    const measurement_id = `telemetry-${Date.now()}`;

    // 1. WESAD ML Inference
    const wesadRes = await fetch('/api/v1/predict/wesad', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...scenario.wesad, measurement_id })
    });
    if (!wesadRes.ok) throw new Error('WESAD ML prediction failed');
    const wesadData = await wesadRes.json();

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
    if (!mmashRes.ok) throw new Error('MMASH ML prediction failed');
    const mmashData = await mmashRes.json();

    // 3. Stateful NSRI Calculation Engine
    const nsriRes = await fetch('/api/v1/nsri/calculate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wesad_stress_probability: wesadData.probability_class_1 ?? wesadData.stress_probability,
        mmash_stress_probability: mmashData.probability_class_1 ?? mmashData.stress_probability,
        hrv_normalized: scenario.hrv_normalized,
        resting_hr_normalized: scenario.resting_hr_normalized,
        external_stress_score: 12.0,
        measurement_id
      })
    });
    if (!nsriRes.ok) throw new Error('NSRI Calculation failed');
    const nsriData = await nsriRes.json();

    return { wesadData, mmashData, nsriData };
  };

  const handleScenarioChange = async (scenarioKey) => {
    setSelectedScenario(scenarioKey);
    setLoading(true);
    setError(null);
    setStatusMessage(`Monitoring scenario updated: ${SCENARIOS[scenarioKey].label}`);

    try {
      const result = await executePipeline(scenarioKey);
      setStatusMessage(`Synced • NSRI Score: ${Math.round(result.nsriData.nsri)} (${result.nsriData.state})`);
      if (onMeasurementSaved) onMeasurementSaved();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to stream telemetry');
    } finally {
      setLoading(false);
    }
  };

  const handleTimelineStep = async (index) => {
    setReplayIndex(index);
    const step = TIMELINE_STEPS[index];
    setSelectedScenario(step.scenario);
    setLoading(true);
    setStatusMessage(`Timeline at ${step.time} (${step.name})`);

    try {
      await executePipeline(step.scenario);
      if (onMeasurementSaved) onMeasurementSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoPlay = () => {
    if (isAutoPlaying) {
      clearInterval(autoPlayTimer.current);
      setIsAutoPlaying(false);
    } else {
      setIsAutoPlaying(true);
      let idx = replayIndex;
      autoPlayTimer.current = setInterval(async () => {
        idx = (idx + 1) % TIMELINE_STEPS.length;
        setReplayIndex(idx);
        const step = TIMELINE_STEPS[idx];
        setSelectedScenario(step.scenario);
        try {
          await executePipeline(step.scenario);
          if (onMeasurementSaved) onMeasurementSaved();
        } catch (err) {
          console.error(err);
        }
      }, 3500);
    }
  };

  useEffect(() => {
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, []);

  return (
    <section className="simulation-studio-section glass-card section-full" id="timeline">
      <div className="section-header-compact">
        <div>
          <h3 className="section-title-text">Live Monitoring & Day Replay</h3>
          <p className="section-subtitle-text">
            Simulate physiological scenarios or step through the 24-hour nervous system timeline
          </p>
        </div>

        <div className="studio-tabs">
          <button 
            className={`studio-tab-btn ${activeTab === 'scenarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('scenarios')}
          >
            Monitoring Scenarios
          </button>
          <button 
            className={`studio-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            24-Hour Timeline
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="studio-status-banner">
          <span className="studio-status-dot"></span>
          <span>{statusMessage}</span>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>
      )}

      {activeTab === 'scenarios' ? (
        /* Scenarios View */
        <div className="scenarios-grid">
          {Object.entries(SCENARIOS).map(([key, item]) => (
            <div 
              key={key} 
              className={`scenario-card ${selectedScenario === key ? 'selected' : ''}`}
              onClick={() => handleScenarioChange(key)}
            >
              <div className="scenario-card-header">
                <span className={`scenario-badge ${item.badgeClass}`}>{item.badge}</span>
                {selectedScenario === key && <span className="scenario-active-check">Active</span>}
              </div>
              <h4 className="scenario-title">{item.label}</h4>
              <p className="scenario-desc">{item.desc}</p>
              <button 
                className="scenario-select-btn" 
                disabled={loading}
                onClick={(e) => { e.stopPropagation(); handleScenarioChange(key); }}
              >
                {loading && selectedScenario === key ? 'Streaming...' : 'Stream Telemetry'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* 24-Hour Timeline View */
        <div className="timeline-replay-container">
          <div className="timeline-controls-row">
            <div className="timeline-current-label">
              <strong>{TIMELINE_STEPS[replayIndex].time}</strong> — {TIMELINE_STEPS[replayIndex].name}
              <span className="timeline-note-text">({TIMELINE_STEPS[replayIndex].note})</span>
            </div>
            <button 
              className={`autoplay-btn ${isAutoPlaying ? 'playing' : ''}`}
              onClick={toggleAutoPlay}
            >
              {isAutoPlaying ? '⏸ Pause Autoplay' : '▶ Autoplay 24h Day'}
            </button>
          </div>

          <div className="timeline-stepper">
            {TIMELINE_STEPS.map((step, idx) => (
              <button
                key={idx}
                className={`timeline-step-node ${replayIndex === idx ? 'current' : idx < replayIndex ? 'passed' : ''}`}
                onClick={() => handleTimelineStep(idx)}
                title={`${step.time}: ${step.name}`}
              >
                <span className="step-dot"></span>
                <span className="step-time-label">{step.time}</span>
              </button>
            ))}
          </div>

          <div className="timeline-step-detail-card">
            <div className="detail-col">
              <span className="detail-label">Active Scenario:</span>
              <span className="detail-val">{SCENARIOS[TIMELINE_STEPS[replayIndex].scenario].label}</span>
            </div>
            <div className="detail-col">
              <span className="detail-label">Autonomic Behavior:</span>
              <span className="detail-val">{TIMELINE_STEPS[replayIndex].note}</span>
            </div>
            <div className="detail-col">
              <span className="detail-label">Physiological State:</span>
              <span className="detail-val">{SCENARIOS[TIMELINE_STEPS[replayIndex].scenario].desc}</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MeasurementInput;
