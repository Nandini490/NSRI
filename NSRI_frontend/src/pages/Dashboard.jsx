import React, { useState, useEffect } from 'react';
import DashboardNav from '../components/DashboardNav';
import PlaceholderCard from '../components/PlaceholderCard';
import TodaysOverview from '../components/TodaysOverview';
import NSRICard from '../components/NSRICard';
import MoodCheckIn from '../components/MoodCheckIn';
import QuickActions from '../components/QuickActions';
import AIChat from '../components/AIChat/AIChat';
import { fetchDashboardData } from '../services/dashboardService';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({ nsri_data: null, previous_nsri_data: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        if (err.message !== 'Authentication expired') {
          setError('We couldn\'t load your NSRI right now. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hasData = dashboardData && dashboardData.nsri_data;

  return (
    <div className="dashboard-layout">
      <DashboardNav />
      
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1 className="dashboard-greeting">Good morning, Traveler</h1>
          <p className="dashboard-subtitle">Here is your daily wellness and recovery summary.</p>
        </header>

        {error && (
          <div className="error-message" style={{marginBottom: '24px'}}>{error}</div>
        )}

        <div className="dashboard-grid">
          {/* Top Row */}
          {loading ? (
            <>
              <PlaceholderCard className="section-two-thirds" title="Calculating your NSRI..." />
              <PlaceholderCard className="section-third" title="Loading NSRI..." />
            </>
          ) : !hasData ? (
            <div className="section-full glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <h3>Not enough wellness data yet.</h3>
              <p className="placeholder-text" style={{marginTop: '12px'}}>Your NSRI and overview will appear here once you record your first measurement.</p>
            </div>
          ) : (
            <>
              <TodaysOverview data={dashboardData.nsri_data} />
              <NSRICard current={dashboardData.nsri_data} previous={dashboardData.previous_nsri_data} />
            </>
          )}

          {/* Center Row — AI Assistant */}
          <div className="glass-card section-full">
            <AIChat nsriData={dashboardData.nsri_data ?? null} />
          </div>

          {/* Below Row */}
          <MoodCheckIn />
          <QuickActions />

          {/* Further Down Row */}
          <PlaceholderCard 
            className="section-two-thirds" 
            title="Weekly Trends" 
            icon="M3 3v18h18 M18 9l-5 5-3-3-5 5" 
          />
          <PlaceholderCard 
            className="section-third" 
            title="AI Insights" 
            icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          />

          {/* Bottom Row */}
          <PlaceholderCard 
            className="section-third" 
            title="Recovery Suggestions" 
            icon="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z M16 8L2 22 M17.5 15H9" 
          />
          <PlaceholderCard 
            className="section-third" 
            title="Lifestyle Tracker" 
            icon="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" 
          />
          <PlaceholderCard 
            className="section-third" 
            title="Journaling / Reflection" 
            icon="M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" 
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
