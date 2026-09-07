import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const API_BASE_URL = '/api/v1';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = `Server Error (${response.status}). Please try again later.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Securely store JWT
      localStorage.setItem('nsri_token', data.access_token);
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.2"/>
              <path d="M12 2v20" stroke="var(--primary)"/>
              <path d="M2 12h20" stroke="var(--secondary)"/>
              <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.8"/>
            </svg>
          </div>
          <h1 className="auth-title">Know your state.</h1>
          <p className="auth-subtitle">Sign in to uncover your wellness and recovery insights.</p>
        </div>
        
        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            )}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account? 
          <a href="/signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>
            Start your journey
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
