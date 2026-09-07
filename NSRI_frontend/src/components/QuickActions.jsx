import React, { useState } from 'react';
import '../styles/Dashboard.css';

const ACTIONS = [
  { id: 'reset', label: 'Take a 2-minute reset', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
  { id: 'breathe', label: 'Breathing', icon: 'M2 12h4l3-9 5 18 3-9h5' },
  { id: 'water', label: 'Drink water', icon: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z' },
  { id: 'stretch', label: 'Stretch', icon: 'M5 18v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2 M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
  { id: 'walk', label: 'Short walk', icon: 'M13 4v16 M17 8l-4-4-4 4 M13 20l4-4 M9 16l4 4' },
  { id: 'break', label: 'Screen break', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'journal', label: 'Journal', icon: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' }
];

const QuickActions = () => {
  const [activeAction, setActiveAction] = useState(null);

  const handleActionClick = (action) => {
    // For Task 3, these are lightweight interactions.
    let message = '';
    switch (action.id) {
      case 'reset': message = 'Take a moment to close your eyes and reset. A small reset might help.'; break;
      case 'breathe': message = 'Inhale deeply for 4 seconds, hold for 4, exhale for 6. You may want to repeat this 3 times.'; break;
      case 'water': message = 'Hydration is key to recovery. Consider grabbing a glass of water.'; break;
      case 'stretch': message = 'Stand up and reach for the ceiling. A gentle stretch helps circulation.'; break;
      case 'walk': message = 'Consider taking a short 5-minute walk when you have a moment.'; break;
      case 'break': message = 'Look at something 20 feet away for 20 seconds to rest your eyes.'; break;
      case 'journal': message = 'Jotting down your thoughts can help clarify your mind. The journal feature is coming soon.'; break;
      default: message = 'Take care of yourself today.';
    }
    setActiveAction(message);
    setTimeout(() => setActiveAction(null), 5000);
  };

  return (
    <div className="glass-card section-half quick-actions-card">
      <div className="glass-card-header">
        <div className="glass-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Quick Actions
        </div>
      </div>

      <div className="quick-actions-content">
        <div className="actions-grid">
          {ACTIONS.map(action => (
            <button 
              key={action.id} 
              className="action-btn"
              onClick={() => handleActionClick(action)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={action.icon} />
              </svg>
              <span>{action.label}</span>
            </button>
          ))}
        </div>

        {activeAction && (
          <div className="action-toast">
            {activeAction}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActions;
