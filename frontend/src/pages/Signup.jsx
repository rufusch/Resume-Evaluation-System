import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await signup(fullName, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card-cream" style={{ width: '100%', maxWidth: '460px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '8px' }}>
            Create your account.
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-wine-muted)', lineHeight: '1.5' }}>
            Build your profile, analyze roles and track your preparation.
          </p>
        </div>

        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-missing-bg)', color: 'var(--status-missing-text)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', fontSize: '13px', border: '1px solid var(--status-missing-border)' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

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
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--text-wine-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--btn-cherry-bg)', fontWeight: '600', textDecoration: 'underline' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
