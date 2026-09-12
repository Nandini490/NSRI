import React from 'react';
import '../styles/Dashboard.css';

const RecoveryGuidance = ({ data }) => {
  if (!data) return null;

  const score = Math.round(data.nsri ?? 0);
  const sai = Math.round(data.sai ?? 0);
  const pri = Math.round(data.pri ?? 50);
  const rdt = Math.round(data.rdt ?? 0);

  // Recommendations tailored to score & sub-indices
  let recommendations = [];

  if (score <= 20) {
    // Balanced
    recommendations = [
      {
        title: 'Maintain Current Autonomic Rhythm',
        action: 'Your parasympathetic tone is strong. Ideal window for deep analytical focus, creative work, or physical exertion.',
        icon: 'check',
        tag: 'Optimal Performance'
      },
      {
        title: 'Sustain Hydration & Nutrition',
        action: 'Support continuous metabolic balance with consistent water intake and balanced meals.',
        icon: 'droplet',
        tag: 'Baseline Maintenance'
      },
      {
        title: 'Regular Sleep Timing',
        action: 'Maintain consistent sleep and wake timing to reinforce your circadian autonomic cycle.',
        icon: 'moon',
        tag: 'Circadian Sync'
      }
    ];
  } else if (score <= 40) {
    // Loaded
    recommendations = [
      {
        title: 'Pacing & Micro-Resets',
        action: 'Take 2-minute visual and postural resets between sustained cognitive tasks to prevent stress compounding.',
        icon: 'coffee',
        tag: 'Active Pacing'
      },
      {
        title: 'Gentle Movement or Walking',
        action: 'A relaxed 15-minute walk helps clear residual sympathetic tension and supports venous circulation.',
        icon: 'activity',
        tag: 'Circulatory Reset'
      },
      {
        title: 'Guard Evening Downtime',
        action: 'Begin dimming intense overhead lighting 60 minutes before bed to allow melatonin release and parasympathetic priming.',
        icon: 'moon',
        tag: 'Sleep Hygiene'
      }
    ];
  } else if (score <= 60) {
    // Strained
    recommendations = [
      {
        title: 'Resonant Breathing Protocol (5 Mins)',
        action: 'Practice 4-second nasal inhalations followed by 6-second slow exhalations to stimulate the vagus nerve and elevate HRV.',
        icon: 'wind',
        tag: 'Down-Regulation'
      },
      {
        title: 'Reduce Continuous Screen Exposure',
        action: 'Take a structured 10-minute screen break. Step away from notifications and intense digital stimuli.',
        icon: 'eye-off',
        tag: 'Stimulus Reduction'
      },
      {
        title: 'Limit Late Caffeine & Heavy Meals',
        action: 'Avoid stimulants after 2 PM and heavy late-evening meals to protect nocturnal heart rate deceleration and sleep architecture.',
        icon: 'shield',
        tag: 'Recovery Protection'
      }
    ];
  } else if (score <= 80) {
    // Dysregulated
    recommendations = [
      {
        title: 'Immediate Cognitive Offload',
        action: 'Delegate or pause non-urgent high-stress tasks. Sustained load under dysregulation accelerates recovery debt accumulation.',
        icon: 'alert-triangle',
        tag: 'Stress Mitigation'
      },
      {
        title: 'Extended Parasympathetic Rest',
        action: 'Engage in 15–20 minutes of restorative resting (lying down quietly, listening to calm ambient audio or nature sounds).',
        icon: 'heart',
        tag: 'Vagal Recovery'
      },
      {
        title: 'Prioritize 8+ Hours Uninterrupted Sleep',
        action: 'Create a quiet, cool (18–20°C) sleep environment and prepare for an early bedtime tonight.',
        icon: 'moon',
        tag: 'Deep Replenishment'
      }
    ];
  } else {
    // Exhausted / Burnout Risk
    recommendations = [
      {
        title: 'Cease High-Intensity Exertion',
        action: 'Halt demanding physical or mental workouts immediately. Your autonomic recovery capacity is depleted.',
        icon: 'alert-octagon',
        tag: 'Crucial Rest'
      },
      {
        title: 'Restorative Quiet Protocol',
        action: 'Minimize all auditory and visual stimulation. Practice passive rest, warm baths, or guided somatic relaxation.',
        icon: 'shield-alert',
        tag: 'System Recovery'
      },
      {
        title: 'Multi-Day Recovery Buffer',
        action: 'Build intentional recovery buffer windows over the next 48 hours to allow the 48-hour debt half-life to clear.',
        icon: 'calendar',
        tag: 'Debt Clearance'
      }
    ];
  }

  return (
    <section className="recovery-guidance-section glass-card section-full" id="recovery-guidance">
      <div className="section-header-compact">
        <div>
          <h3 className="section-title-text">What can I do now?</h3>
          <p className="section-subtitle-text">
            Personalized, non-clinical recovery actions tailored to your current physiological load and debt
          </p>
        </div>
      </div>

      <div className="guidance-grid">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="guidance-card">
            <div className="guidance-card-header">
              <span className="guidance-tag">{rec.tag}</span>
            </div>
            <h4 className="guidance-card-title">{rec.title}</h4>
            <p className="guidance-card-action">{rec.action}</p>
          </div>
        ))}
      </div>

      <div className="guidance-disclaimer-note">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>NSRI recommendations are non-clinical lifestyle and recovery suggestions designed to support autonomic regulation.</span>
      </div>
    </section>
  );
};

export default RecoveryGuidance;
