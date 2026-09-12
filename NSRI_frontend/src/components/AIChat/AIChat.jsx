import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage } from '../../services/chatService';
import './AIChat.css';

const PRIMARY_ACTIONS = [
  {
    label: 'Why am I in this state?',
    query: 'Why am I in this state? Explain the main physiological and recovery factors driving my current score.',
    icon: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
  },
  {
    label: 'What should I do now?',
    query: 'What should I do now? Give me specific, non-clinical recovery and pacing recommendations for my current state.',
    icon: 'M9 12l2 2 4-4 M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z'
  },
  {
    label: 'How did NSRI calculate this?',
    query: 'How did NSRI calculate this score? Explain how SAI, PRI, and RDT combine in the formula.',
    icon: 'M12 8v4l3 3 M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z'
  },
  {
    label: 'Am I recovering?',
    query: 'Am I recovering? Analyze my recent recovery capacity and debt trends.',
    icon: 'M3 3v18h18 M19 9l-5 5-4-4-3 3'
  }
];

const TypingIndicator = () => (
  <div className="nira-message assistant">
    <div className="nira-avatar" aria-label="NIRA">NIRA</div>
    <div className="nira-bubble">
      <div className="nira-typing">
        <span />
        <span />
        <span />
      </div>
      <span className="nira-typing-label">NIRA is interpreting your telemetry...</span>
    </div>
  </div>
);

const Message = ({ msg }) => (
  <div className={`nira-message ${msg.role} ${msg.isError ? 'error' : ''}`}>
    <div className="nira-avatar" aria-hidden="true">
      {msg.role === 'user' ? 'You' : 'NIRA'}
    </div>
    <div className="nira-bubble">
      <div className="nira-bubble-text">{msg.content}</div>
    </div>
  </div>
);

const AIChat = ({ nsriData = null }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const sendMessage = useCallback(async (text) => {
    const query = (text ?? inputValue).trim();
    if (!query || isLoading) return;

    const userMsg = { role: 'user', content: query, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      const responseText = await sendChatMessage(query, nsriData);
      const assistantMsg = {
        role: 'assistant',
        content: responseText,
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content:
          err.message && err.message.includes('offline')
            ? "NIRA local intelligence engine is currently offline. Please ensure Ollama is running (`ollama run llama3.2:3b`)."
            : 'Could not connect to NIRA. Please ensure the backend and Ollama are active.',
        id: Date.now() + 1,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, nsriData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const handleNiraQuery = (e) => {
      if (e.detail?.query) {
        sendMessage(e.detail.query);
      }
    };
    window.addEventListener('nira-ask-query', handleNiraQuery);
    return () => {
      window.removeEventListener('nira-ask-query', handleNiraQuery);
    };
  }, [sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Telemetry metrics
  const hasTelemetry = nsriData !== null && nsriData.nsri !== undefined;
  const score = hasTelemetry ? Math.round(nsriData.nsri) : null;
  const stateLabel = hasTelemetry ? (nsriData.state ?? 'Balanced') : null;
  const sai = hasTelemetry ? Math.round(nsriData.sai ?? 0) : null;
  const pri = hasTelemetry ? Math.round(nsriData.pri ?? 50) : null;
  const rdt = hasTelemetry ? Math.round(nsriData.rdt ?? 0) : null;
  
  const heartRate = hasTelemetry 
    ? (nsriData.Mean_HR ? Math.round(nsriData.Mean_HR) : Math.round(62 + ((sai || 0) / 100) * 35))
    : null;

  const hrv = hasTelemetry
    ? (nsriData.RMSSD ? Math.round(nsriData.RMSSD) : Math.round(20 + ((pri || 50) / 100) * 55))
    : null;

  // Dynamic telemetry-driven insight sentence
  let dynamicInsight = 'Waiting for active monitoring telemetry...';
  if (hasTelemetry) {
    if (score <= 20) {
      dynamicInsight = 'Your current state indicates high parasympathetic recovery reserves and minimal acute stress.';
    } else if (score <= 40) {
      dynamicInsight = 'Your physiological load is manageable, and recovery capacity is maintaining stable equilibrium.';
    } else if (score <= 60) {
      dynamicInsight = 'Your current state suggests elevated physiological load with reduced recovery capacity.';
    } else if (score <= 80) {
      dynamicInsight = 'Sustained sympathetic activation and accumulating recovery debt indicate significant autonomic strain.';
    } else {
      dynamicInsight = 'Critical autonomic deficit detected. Accumulated recovery debt requires dedicated restorative downtime.';
    }
  }

  return (
    <div className="nira-card-wrapper" id="nira-assistant">
      {/* NIRA Header */}
      <div className="nira-card-header">
        <div className="nira-identity-group">
          <div className="nira-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" opacity="0.2"/>
              <path d="M12 6v6l4 2"/>
              <circle cx="12" cy="12" r="3" fill="var(--primary)"/>
            </svg>
          </div>
          <div>
            <div className="nira-name-row">
              <h3 className="nira-main-title">NIRA</h3>
              <span className="nira-role-badge">Intelligence Layer</span>
            </div>
            <p className="nira-subtitle">
              Nervous-system Intelligence & Recovery Assistant
            </p>
          </div>
        </div>

        {/* NIRA Dynamic Status Indicator */}
        <div className={`nira-status-pill ${hasTelemetry ? 'analyzing' : 'waiting'}`}>
          <span className="nira-status-dot"></span>
          <span>
            {hasTelemetry 
              ? 'NIRA is analyzing current monitoring data' 
              : 'NIRA is waiting for monitoring data'}
          </span>
        </div>
      </div>

      <p className="nira-presentation-desc">
        NIRA is the intelligence layer of NSRI, translating physiological signals and recovery patterns into understandable, context-aware guidance.
      </p>

      {/* Current NSRI Context Section */}
      <div className="nira-context-panel">
        <div className="context-panel-header">
          <span className="context-panel-title">Current NSRI Context</span>
          <span className="context-source-tag">Simulated Physiological Stream</span>
        </div>

        {hasTelemetry ? (
          <>
            <div className="nira-telemetry-chips-row">
              <div className="nira-chip chip-score">
                <span className="chip-label">NSRI</span>
                <span className="chip-val">{score} / 100</span>
              </div>
              <div className="nira-chip chip-state">
                <span className="chip-label">State</span>
                <span className="chip-val">{stateLabel}</span>
              </div>
              <div className="nira-chip">
                <span className="chip-label">SAI</span>
                <span className="chip-val">{sai}</span>
              </div>
              <div className="nira-chip">
                <span className="chip-label">PRI</span>
                <span className="chip-val">{pri}</span>
              </div>
              <div className="nira-chip">
                <span className="chip-label">RDT</span>
                <span className="chip-val">{rdt}</span>
              </div>
              <div className="nira-chip">
                <span className="chip-label">Heart Rate</span>
                <span className="chip-val">{heartRate} BPM</span>
              </div>
              <div className="nira-chip">
                <span className="chip-label">HRV (RMSSD)</span>
                <span className="chip-val">{hrv} ms</span>
              </div>
            </div>

            {/* Dynamic Insight Box */}
            <div className="nira-insight-box">
              <div className="insight-pulse-indicator"></div>
              <p className="insight-text">{dynamicInsight}</p>
            </div>
          </>
        ) : (
          <div className="nira-waiting-state">
            <span className="waiting-icon">○</span>
            <span>Waiting for monitoring data to initialize NIRA's contextual analysis...</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="nira-primary-actions-grid">
          {PRIMARY_ACTIONS.map((action) => (
            <button
              key={action.label}
              className="nira-action-btn"
              onClick={() => sendMessage(action.query)}
              disabled={isLoading || !hasTelemetry}
            >
              <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={action.icon} />
              </svg>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="nira-conversation-box">
        {messages.length === 0 ? (
          <div className="nira-empty-conversation">
            <p className="empty-prompt-heading">Ask NIRA</p>
            <p className="empty-prompt-sub">
              Ask about your current recovery state, stress accumulation, or practical non-clinical recovery guidance.
            </p>
          </div>
        ) : (
          <div className="nira-messages-list">
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="nira-input-bar">
        <textarea
          ref={textareaRef}
          className="nira-textarea"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask NIRA about your current recovery state, stress debt, or pacing..."
          rows={1}
          disabled={isLoading}
        />
        <button
          className="nira-send-btn"
          onClick={() => sendMessage()}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send question to NIRA"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AIChat;
