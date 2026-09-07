import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendChatMessage } from '../../services/chatService';
import './AIChat.css';

// ---- Static data --------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  'What is affecting my recovery?',
  'Why did my HRV change?',
  'What does my current state mean?',
  'How does stress affect recovery?',
];

// ---- Sub-components --------------------------------------------------------

const TypingIndicator = () => (
  <div className="ai-chat-message assistant">
    <div className="ai-chat-avatar" aria-hidden="true">AI</div>
    <div className="ai-chat-bubble">
      <div className="ai-chat-typing" aria-label="NSRI assistant is thinking">
        <span />
        <span />
        <span />
      </div>
    </div>
  </div>
);

const Message = ({ msg }) => (
  <div className={`ai-chat-message ${msg.role} ${msg.isError ? 'error' : ''}`}>
    <div className="ai-chat-avatar" aria-hidden="true">
      {msg.role === 'user' ? 'You' : 'AI'}
    </div>
    <div className="ai-chat-bubble">{msg.content}</div>
  </div>
);

const EmptyState = ({ onSuggest, isLoading }) => (
  <div className="ai-chat-empty">
    <div className="ai-chat-empty-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.3" />
        <path d="M12 6v6l4 2" />
      </svg>
    </div>
    <div>
      <p className="ai-chat-empty-heading">Ask the NSRI Assistant</p>
      <p className="ai-chat-empty-text">
        Learn about stress, recovery, sleep, HRV, and the science behind your nervous system.
      </p>
    </div>

    <div className="ai-chat-suggestions" role="list" aria-label="Suggested questions">
      <span className="ai-chat-suggestions-label">Try asking</span>
      {SUGGESTED_QUESTIONS.map((q) => (
        <button
          key={q}
          className="ai-chat-suggestion-btn"
          onClick={() => onSuggest(q)}
          disabled={isLoading}
          role="listitem"
          aria-label={`Ask: ${q}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          {q}
        </button>
      ))}
    </div>
  </div>
);

// ---- Main component ---------------------------------------------------------

/**
 * AIChat — Phase 3
 *
 * Accepts an optional nsriData prop (the dashboard's nsri_data object,
 * already fetched from GET /api/v1/nsri/latest).  This is passed through
 * to sendChatMessage so the backend can inject the user's NSRI context
 * into the Llama system prompt.
 *
 * No NSRI calculation happens in this component. It only forwards data
 * the Dashboard already holds.
 *
 * @param {object|null} nsriData - The nsri_data object from dashboardData,
 *                                  or null when data is unavailable.
 */
const AIChat = ({ nsriData = null }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to the latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea as user types
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text ?? inputValue).trim();
    if (!trimmed || isLoading) return;

    const userMsg = { role: 'user', content: trimmed, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);

    try {
      // nsriData is passed from Dashboard; sendChatMessage forwards it
      // to the backend as nsri_context so Llama can explain personal values.
      const responseText = await sendChatMessage(trimmed, nsriData);
      const assistantMsg = {
        role: 'assistant',
        content: responseText,
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: err.message || "I'm unable to connect to the NSRI AI assistant right now. Please make sure the local AI service is running and try again.",
        isError: true,
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [inputValue, isLoading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSendClick = () => sendMessage();

  const handleSuggestQuestion = useCallback((question) => {
    sendMessage(question);
  }, [sendMessage]);

  const isEmpty = messages.length === 0;

  return (
    <div className="ai-chat-wrapper" role="region" aria-label="NSRI AI Assistant">

      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-title-group">
          <h2 className="ai-chat-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            NSRI Intelligence
          </h2>
          <span className="ai-chat-subtitle">
            Understand your nervous system
          </span>
        </div>
        <div className="ai-chat-status" aria-label="Assistant status: online">
          <span className="ai-chat-status-dot" aria-hidden="true" />
          <span>Online</span>
        </div>
      </div>

      {/* Message area or empty state */}
      {isEmpty ? (
        <EmptyState onSuggest={handleSuggestQuestion} isLoading={isLoading} />
      ) : (
        <div
          className="ai-chat-messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation"
        >
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}
          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} aria-hidden="true" />
        </div>
      )}

      {/* Input area */}
      <div className="ai-chat-input-area">
        <textarea
          ref={(el) => {
            textareaRef.current = el;
            inputRef.current = el;
          }}
          id="ai-chat-input"
          className="ai-chat-input"
          placeholder="Ask about stress, HRV, recovery, sleep…"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
          aria-label="Type your message"
          aria-multiline="true"
        />
        <button
          id="ai-chat-send-btn"
          className="ai-chat-send-btn"
          onClick={handleSendClick}
          disabled={isLoading || !inputValue.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {/* Disclaimer */}
      <p className="ai-chat-disclaimer">
        Educational assistant only · Not a medical diagnosis tool · Shift+Enter for new line
      </p>
    </div>
  );
};

export default AIChat;
