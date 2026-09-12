import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Dashboard.css';

const DashboardNav = ({ onOpenHowItWorks }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = React.useState('#overview');

  const handleLogout = () => {
    localStorage.removeItem('nsri_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '#overview', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'Live Signals', path: '#signals', icon: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    { name: 'NIRA Insight', path: '#nira-insight', icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' },
    { name: 'Snapshots & Reports', path: '#snapshots', icon: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { name: 'Score Drivers', path: '#breakdown', icon: 'M12 20V10 M18 20V4 M6 20v-4' },
    { name: 'Recovery Trajectory', path: '#trajectory', icon: 'M3 3v18h18 M19 9l-5 5-4-4-3 3' },
    { name: 'Recovery Guidance', path: '#recovery-guidance', icon: 'M9 12l2 2 4-4 M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z' },
    { name: 'Timeline Replay', path: '#timeline', icon: 'M12 8v4l3 3 M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z' },
    { name: 'NIRA Assistant', path: '#nira-assistant', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
    { name: 'History Logs', path: '#history', icon: 'M12 8v4l3 3 M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5' },
  ];

  const handleNavClick = (targetHash) => {
    setActiveSection(targetHash);
    const el = document.querySelector(targetHash);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <aside className="dashboard-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.15"/>
            <path d="M12 2v20" stroke="var(--primary)"/>
            <path d="M2 12h20" stroke="var(--sage)"/>
            <circle cx="12" cy="12" r="4" fill="var(--primary)" stroke="none" opacity="0.9"/>
          </svg>
        </div>
        <div>
          <div className="sidebar-title">NSRI</div>
          <div className="sidebar-subtitle-text">Recovery Intelligence</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button 
            key={item.name}
            className={`nav-item ${activeSection === item.path ? 'active' : ''}`}
            onClick={() => handleNavClick(item.path)}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      {/* How It Works & Sign Out */}
      <div className="sidebar-footer">
        <button 
          className="how-it-works-sidebar-btn"
          onClick={onOpenHowItWorks}
        >
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>How NSRI Works</span>
        </button>

        <button className="logout-button" onClick={handleLogout}>
          <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardNav;
