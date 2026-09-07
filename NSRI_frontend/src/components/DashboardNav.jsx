import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';

const DashboardNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('nsri_token');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { name: 'Journal', path: '#journal', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
    { name: 'Insights', path: '#insights', icon: 'M12 20V10 M18 20V4 M6 20v-4' },
    { name: 'Profile', path: '#profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.2"/>
            <path d="M12 2v20" stroke="var(--primary)"/>
            <path d="M2 12h20" stroke="var(--secondary)"/>
            <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.8"/>
          </svg>
        </div>
        <div className="sidebar-title">NSRI</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button 
            key={item.name}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => {
              if (item.path.startsWith('/')) {
                navigate(item.path);
              }
            }}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
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
