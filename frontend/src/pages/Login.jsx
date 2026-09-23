import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [workspace, setWorkspace] = useState(location.state?.from?.pathname === '/hr' || new URLSearchParams(location.search).get('workspace') === 'hr' ? 'hr' : 'candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(location.state?.message || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(email, password);
      const from = workspace === 'hr' ? '/hr' : (location.state?.from?.pathname === '/hr' ? '/' : location.state?.from?.pathname || '/');
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card-cream" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '8px' }}>
            Welcome to Career Lens.
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-wine-muted)', lineHeight: '1.5' }}>
            Choose your workspace to prepare for a role or review applicants.
          </p>
        </div>

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-missing-bg)', color: 'var(--status-missing-text)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '13px', border: '1px solid var(--status-missing-border)' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="workspace-switch" aria-label="Workspace">
          <button type="button" aria-pressed={workspace === 'candidate'} onClick={() => setWorkspace('candidate')}>Candidate</button>
          <button type="button" aria-pressed={workspace === 'hr'} onClick={() => setWorkspace('hr')}>HR / Recruiter</button>
        </div>
        <p style={{ color: 'var(--text-wine-muted)', marginBottom: '18px', fontSize: '13px' }}>{workspace === 'hr' ? 'One job description, multiple resumes, and a review dashboard. Your hiring campaigns are private to your account.' : 'Analyze your resume, explore skill gaps, and prepare for interviews.'}</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="sarah.jenkins@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button
                type="button"
                onClick={() => alert('For this demonstration, passwords can be reset via your Account page once logged in.')}
                style={{ fontSize: '12px', color: 'var(--text-wine-muted)', textDecoration: 'underline' }}
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', marginTop: '10px', padding: '12px' }}
          >
            {isSubmitting ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--text-wine-muted)' }}>
          Don't have an account?{' '}
          <Link to={workspace === 'hr' ? '/signup?workspace=hr' : '/signup'} style={{ color: 'var(--btn-cherry-bg)', fontWeight: '600', textDecoration: 'underline' }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
