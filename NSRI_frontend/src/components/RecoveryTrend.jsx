import React, { useState, useEffect } from 'react';
import { fetchHistory } from '../services/dashboardService';
import '../styles/Dashboard.css';

const RecoveryTrend = ({ currentData }) => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchHistory(7);
        setHistoryItems(res.history || []);
      } catch (err) {
        console.error('Failed to load history for trajectory chart', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentData]);

  // Combine history items or use default
  const points = historyItems.map(item => ({
    time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    nsri: Math.round(item.data?.nsri ?? 0),
    sai: Math.round(item.data?.sai ?? 0),
    pri: Math.round(item.data?.pri ?? 50),
    rdt: Math.round(item.data?.rdt ?? 0),
    state: item.data?.state ?? 'Balanced'
  }));

  const hasPoints = points.length > 0;

  // Determine recovery trajectory direction
  let trajectoryStatus = {
    label: 'Baseline Equilibrium',
    desc: 'Establishing initial recovery baseline',
    class: 'trajectory-stable'
  };

  if (points.length >= 2) {
    const first = points[0].nsri;
    const latest = points[points.length - 1].nsri;
    const delta = latest - first;
    if (delta <= -4) {
      trajectoryStatus = {
        label: 'Improving Recovery',
        desc: `Autonomic strain has decreased by ${Math.abs(delta)} points`,
        class: 'trajectory-improving'
      };
    } else if (delta >= 4) {
      trajectoryStatus = {
        label: 'Under Elevated Strain',
        desc: `Stress accumulation has increased by +${delta} points`,
        class: 'trajectory-straining'
      };
    } else {
      trajectoryStatus = {
        label: 'Stable Autonomic State',
        desc: 'Nervous system load is holding at steady equilibrium',
        class: 'trajectory-stable'
      };
    }
  }

  // SVG dimensions
  const svgWidth = 700;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Coordinate mapping (NSRI: 0 at bottom, 100 at top)
  const getX = (idx, total) => {
    if (total <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (total - 1)) * chartW;
  };
  const getY = (val) => padTop + chartH - (Math.max(0, Math.min(100, val)) / 100) * chartH;

  const polylinePoints = points.map((p, i) => `${getX(i, points.length)},${getY(p.nsri)}`).join(' ');
  const areaPoints = points.length > 0 ? 
    `${getX(0, points.length)},${padTop + chartH} ${polylinePoints} ${getX(points.length - 1, points.length)},${padTop + chartH}` 
    : '';

  return (
    <section id="trajectory" className="recovery-trend-card glass-card section-full">
      <div className="section-header-compact">
        <div>
          <h3 className="section-title-text">My Recovery Trajectory</h3>
          <p className="section-subtitle-text">
            7-day longitudinal recovery tracking and autonomic state evolution
          </p>
        </div>

        <div className={`trajectory-pill ${trajectoryStatus.class}`}>
          <span className="trajectory-status-name">{trajectoryStatus.label}</span>
          <span className="trajectory-status-sub">• {trajectoryStatus.desc}</span>
        </div>
      </div>

      <div className="trend-chart-container">
        {loading ? (
          <div className="chart-placeholder-state">
            <div className="spinner-loader"></div>
            <p>Loading recovery trajectory from MongoDB...</p>
          </div>
        ) : !hasPoints ? (
          <div className="chart-placeholder-state">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p className="chart-placeholder-title">Awaiting Longitudinal Data</p>
            <span className="chart-placeholder-desc">
              Your real-time measurements will plot here across 7-day autonomic recovery bands.
            </span>
          </div>
        ) : (
          <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="trend-svg">
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.30" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* State Background Bands */}
            <rect x={padLeft} y={getY(100)} width={chartW} height={getY(60) - getY(100)} fill="rgba(185, 103, 93, 0.08)" />
            <rect x={padLeft} y={getY(60)} width={chartW} height={getY(40) - getY(60)} fill="rgba(217, 130, 114, 0.08)" />
            <rect x={padLeft} y={getY(40)} width={chartW} height={getY(20) - getY(40)} fill="rgba(168, 121, 93, 0.08)" />
            <rect x={padLeft} y={getY(20)} width={chartW} height={getY(0) - getY(20)} fill="rgba(113, 135, 116, 0.08)" />

            {/* Y-Axis Gridlines & Labels */}
            {[0, 20, 40, 60, 80, 100].map(val => (
              <g key={val}>
                <line 
                  x1={padLeft} 
                  y1={getY(val)} 
                  x2={padLeft + chartW} 
                  y2={getY(val)} 
                  stroke="var(--border-light)" 
                  strokeDasharray="3 3" 
                  strokeWidth="1"
                />
                <text 
                  x={padLeft - 8} 
                  y={getY(val) + 4} 
                  textAnchor="end" 
                  fontSize="11" 
                  fill="var(--text-muted)"
                >
                  {val}
                </text>
              </g>
            ))}

            {/* Area & Polyline */}
            {points.length > 1 && (
              <>
                <polygon points={areaPoints} fill="url(#trendGradient)" />
                <polyline points={polylinePoints} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}

            {/* Data Points */}
            {points.map((p, idx) => {
              const cx = getX(idx, points.length);
              const cy = getY(p.nsri);
              const isLatest = idx === points.length - 1;
              return (
                <g key={idx} className="trend-point-group">
                  {isLatest && (
                    <circle cx={cx} cy={cy} r="8" fill="var(--primary)" opacity="0.2" className="latest-pulse-ring" />
                  )}
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={isLatest ? "5" : "3.5"} 
                    fill={isLatest ? "var(--primary)" : "var(--surface)"} 
                    stroke="var(--primary)" 
                    strokeWidth="2" 
                  />
                  <text 
                    x={cx} 
                    y={padTop + chartH + 18} 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="var(--text-secondary)"
                  >
                    {p.time}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Legend */}
        <div className="trend-bands-legend">
          <span className="band-legend-item"><span className="band-color-dot dot-balanced"></span> 0–20 Balanced</span>
          <span className="band-legend-item"><span className="band-color-dot dot-loaded"></span> 20–40 Loaded</span>
          <span className="band-legend-item"><span className="band-color-dot dot-strained"></span> 40–60 Strained</span>
          <span className="band-legend-item"><span className="band-color-dot dot-dysregulated"></span> 60–100 Dysregulated/Depleted</span>
        </div>
      </div>
    </section>
  );
};

export default RecoveryTrend;
