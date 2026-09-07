import React, { useState, useEffect } from 'react';
import { saveMoodCheckIn, getRecentMoodCheckIns } from '../services/wellnessService';
import '../styles/Dashboard.css';

const MOODS = ['Great', 'Good', 'Okay', 'Low', 'Difficult'];

const MoodCheckIn = () => {
  const [selectedMood, setSelectedMood] = useState('');
  const [energy, setEnergy] = useState(3);
  const [stress, setStress] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [note, setNote] = useState('');
  
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadRecentCheckins = async () => {
    try {
      const response = await getRecentMoodCheckIns();
      setRecentCheckins(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentCheckins();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) {
      setMessage('Please select a mood first.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      await saveMoodCheckIn({
        mood: selectedMood,
        energy,
        stress,
        sleep_quality: sleep,
        note: note.trim() || undefined
      });
      
      setMessage('Check-in saved successfully.');
      setSelectedMood('');
      setNote('');
      setEnergy(3);
      setStress(3);
      setSleep(3);
      
      await loadRecentCheckins();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.message || 'Failed to save check-in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card section-half mood-checkin-card">
      <div className="glass-card-header">
        <div className="glass-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01" />
          </svg>
          Mood Check-In
        </div>
      </div>

      <div className="mood-content">
        <form onSubmit={handleSubmit} className="mood-form">
          <div className="form-group">
            <label>How are you feeling today?</label>
            <div className="mood-buttons">
              {MOODS.map(m => (
                <button 
                  type="button" 
                  key={m} 
                  className={`mood-btn ${selectedMood === m ? 'active' : ''}`}
                  onClick={() => setSelectedMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="sliders-grid">
            <div className="slider-group">
              <label>Energy <span>{energy}/5</span></label>
              <input type="range" min="1" max="5" value={energy} onChange={e => setEnergy(parseInt(e.target.value))} />
            </div>
            
            <div className="slider-group">
              <label>Stress <span>{stress}/5</span></label>
              <input type="range" min="1" max="5" value={stress} onChange={e => setStress(parseInt(e.target.value))} />
            </div>

            <div className="slider-group">
              <label>Sleep Quality <span>{sleep}/5</span></label>
              <input type="range" min="1" max="5" value={sleep} onChange={e => setSleep(parseInt(e.target.value))} />
            </div>
          </div>

          <div className="form-group note-group">
            <label>Anything you'd like to note? <span className="optional-text">(Optional)</span></label>
            <input 
              type="text" 
              placeholder="Briefly describe what's on your mind..."
              value={note}
              onChange={e => setNote(e.target.value)}
              maxLength={1000}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn" disabled={!selectedMood || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Check-In'}
            </button>
            {message && <span className="message-text">{message}</span>}
          </div>
        </form>

        <div className="recent-checkins">
          <h5>Recent Check-Ins</h5>
          {loading ? (
            <p className="placeholder-text">Loading...</p>
          ) : recentCheckins.length === 0 ? (
            <p className="placeholder-text">No check-ins yet. Your check-ins will appear here as you use the app.</p>
          ) : (
            <ul className="recent-list">
              {recentCheckins.slice(0, 3).map((checkin) => (
                <li key={checkin._id} className="recent-item">
                  <div className="recent-header">
                    <span className="recent-mood">{checkin.mood}</span>
                    <span className="recent-date">{new Date(checkin.created_at).toLocaleDateString()}</span>
                  </div>
                  {checkin.note && <div className="recent-note">"{checkin.note}"</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodCheckIn;
