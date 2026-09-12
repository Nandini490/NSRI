import React, { useState, useEffect } from 'react';
import { fetchHistory } from '../services/dashboardService';
import '../styles/Dashboard.css';

const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetchHistory(7);
        setHistoryItems(res.history || []);
      } catch (err) {
        setError("Failed to load history data.");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  if (loading) {
    return (
      <div className="glass-card section-full">
        <style>{`
          @keyframes historyPulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.7; }
            100% { opacity: 0.3; }
          }
          .skeleton-cell {
            height: 16px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            animation: historyPulse 1.5s ease-in-out infinite;
          }
        `}</style>
        <div className="glass-card-header">
          <div className="glass-card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
            NSRI History (Last 7 Days)
          </div>
        </div>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Date</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>Time</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>NSRI</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>State</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>SAI</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>PRI</th>
                <th style={{ padding: '12px 8px', fontWeight: '500' }}>RDT</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={`skeleton-${i}`} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '60px' }}></div></td>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '80px' }}></div></td>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                  <td style={{ padding: '12px 8px' }}><div className="skeleton-cell" style={{ width: '40px' }}></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card section-full" style={{ padding: '20px', textAlign: 'center' }}>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="glass-card section-full" style={{ padding: '40px', textAlign: 'center' }}>
        <h3>No Data Available</h3>
        <p className="placeholder-text" style={{ marginTop: '12px' }}>
          Your NSRI history will appear here once you record your first measurement.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card section-full">
      <div className="glass-card-header">
        <div className="glass-card-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          NSRI History (Last 7 Days)
        </div>
      </div>
      <div style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>Date</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>Time</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>NSRI</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>State</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>SAI</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>PRI</th>
              <th style={{ padding: '12px 8px', fontWeight: '500' }}>RDT</th>
            </tr>
          </thead>
          <tbody>
            {historyItems.map((item, index) => {
              const dateObj = new Date(item.created_at);
              const data = item.data || {};
              
              let showGap = false;
              if (index < historyItems.length - 1) {
                const prevItem = historyItems[index + 1];
                if (item.created_at && prevItem.created_at) {
                  const currentMs = new Date(item.created_at).getTime();
                  const prevMs = new Date(prevItem.created_at).getTime();
                  const gapHours = Math.abs(currentMs - prevMs) / (1000 * 60 * 60);
                  if (gapHours >= 12) {
                    showGap = true;
                  }
                }
              }

              return (
                <React.Fragment key={item._id || index}>
                  <tr style={{ borderBottom: showGap ? 'none' : '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 8px' }}>{dateObj.toLocaleDateString()}</td>
                    <td style={{ padding: '12px 8px' }}>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{Math.round(data.nsri || 0)}</td>
                    <td style={{ padding: '12px 8px' }}>{data.state || 'N/A'}</td>
                    <td style={{ padding: '12px 8px' }}>{Math.round(data.sai || 0)}</td>
                    <td style={{ padding: '12px 8px' }}>{Math.round(data.pri || 0)}</td>
                    <td style={{ padding: '12px 8px' }}>{Math.round(data.rdt || 0)}</td>
                  </tr>
                  {showGap && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td colSpan="7" style={{ padding: '16px 8px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          <span>Time gap — no measurement recorded</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: '4px' }}>
                          NSRI history may have decayed during this period
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default History;
