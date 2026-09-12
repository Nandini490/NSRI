import React from 'react';
import '../styles/Dashboard.css';

const HowItWorksModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="how-it-works-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-badge">Architecture & Science</span>
            <h3 className="modal-title">How NSRI Works</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: Telemetry */}
          <div className="tech-pipeline-row">
            <div className="tech-pipeline-step">
              <div className="tech-step-num">1</div>
              <div className="tech-step-content">
                <h5>Raw Biosensor Telemetry</h5>
                <p>Ingests real-time ECG/BVP (heart rate, RMSSD, SDNN, pNN50), Galvanic Skin Response / EDA (tonic & phasic peaks), respiration rate, and skin temperature.</p>
              </div>
            </div>

            {/* Step 2: ML Inference */}
            <div className="tech-pipeline-step">
              <div className="tech-step-num">2</div>
              <div className="tech-step-content">
                <h5>Dual ML Inference Engine</h5>
                <ul>
                  <li><strong>WESAD Model:</strong> Random Forest classifier trained on laboratory multimodal stress protocols to evaluate acute sympathetic arousal.</li>
                  <li><strong>MMASH Model:</strong> XGBoost model trained on 24-hour ambulatory lifestyle and sleep datasets to evaluate daily recovery-related features.</li>
                </ul>
              </div>
            </div>

            {/* Step 3: State Integration */}
            <div className="tech-pipeline-step">
              <div className="tech-step-num">3</div>
              <div className="tech-step-content">
                <h5>Stateful Autonomic Integration</h5>
                <p>Rather than treating momentary readings as static ground truth, continuous differential equations model accumulation and exponential decay:</p>
                <div className="tech-constants-grid">
                  <div className="tech-constant-item">
                    <strong>SAI (Stress Load)</strong>
                    <span>Exponential half-life: <code>τ = 4 hours</code></span>
                  </div>
                  <div className="tech-constant-item">
                    <strong>PRI (Recovery Capacity)</strong>
                    <span>Exponential half-life: <code>τ = 8 hours</code></span>
                  </div>
                  <div className="tech-constant-item">
                    <strong>RDT (Recovery Debt)</strong>
                    <span>Longitudinal half-life: <code>τ = 48 hours</code></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 4: Formula */}
            <div className="tech-pipeline-step">
              <div className="tech-step-num">4</div>
              <div className="tech-step-content">
                <h5>Mathematical Composite Formulation</h5>
                <div className="math-formula-card">
                  <code>NSRI = 0.20 · SAI + 0.30 · (100 − PRI) + 0.50 · RDT</code>
                </div>
                <p className="math-desc-text">
                  The composite score (0–100) emphasizes recovery debt (50%) and recovery capacity deficit (30%) over momentary stress (20%), preventing false alarm spikes.
                </p>
              </div>
            </div>

            {/* Step 5: States */}
            <div className="tech-pipeline-step">
              <div className="tech-step-num">5</div>
              <div className="tech-step-content">
                <h5>Autonomic State Classification</h5>
                <table className="tech-states-table">
                  <thead>
                    <tr>
                      <th>Score Range</th>
                      <th>Classification</th>
                      <th>Physiological State</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>0 – 20</td>
                      <td><span className="state-pill state-balanced">Balanced</span></td>
                      <td>Optimal vagal tone; high parasympathetic reserves</td>
                    </tr>
                    <tr>
                      <td>20 – 40</td>
                      <td><span className="state-pill state-loaded">Loaded</span></td>
                      <td>Moderate physiological demand; stable recovery capacity</td>
                    </tr>
                    <tr>
                      <td>40 – 60</td>
                      <td><span className="state-pill state-strained">Strained</span></td>
                      <td>Elevated sympathetic load; recovery rate lagging</td>
                    </tr>
                    <tr>
                      <td>60 – 80</td>
                      <td><span className="state-pill state-dysregulated">Dysregulated</span></td>
                      <td>Suppressed HRV; prominent recovery debt accumulation</td>
                    </tr>
                    <tr>
                      <td>80 – 90</td>
                      <td><span className="state-pill state-exhausted">Exhausted</span></td>
                      <td>Critical recovery debt; severe autonomic depletion</td>
                    </tr>
                    <tr>
                      <td>90 – 100</td>
                      <td><span className="state-pill state-burnout">Burnout Risk</span></td>
                      <td>Multi-day chronic depletion; restorative protocol required</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="non-clinical-disclaimer">
            <strong>Non-Clinical Scope:</strong> NSRI is an autonomous recovery intelligence system designed for wellness, lifestyle pacing, and longitudinal self-awareness. It does not provide medical diagnosis or treatment.
          </div>
          <button className="modal-done-btn" onClick={onClose}>
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksModal;
