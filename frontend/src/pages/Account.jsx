import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Shield, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Account() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please complete all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setIsChanging(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.changePassword(oldPassword, newPassword);
      setSuccessMsg('Your password has been changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      setErrorMsg(err.message || 'Could not change password. Please verify your current password.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px', maxWidth: '680px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: '700', marginBottom: '8px' }}>
          Your Account
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-cream-muted)' }}>
          Manage your profile and authentication credentials.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="card-cream" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={28} color="var(--btn-cherry-bg)" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
              {user?.name || 'Registered User'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--text-wine-muted)', marginTop: '2px' }}>
              <Mail size={14} />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--card-cream-border)', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-wine-muted)' }}>
            Session active under authenticated bearer credentials
          </span>
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ color: '#8c1d1d', borderColor: 'var(--card-cream-border)', padding: '8px 16px', fontSize: '13px' }}
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="card-cream">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Shield size={18} color="var(--btn-cherry-bg)" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
            Change Password
          </h3>
        </div>

        {successMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-full-bg)', color: 'var(--status-full-text)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px', border: '1px solid var(--status-full-border)' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--status-missing-bg)', color: 'var(--status-missing-text)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '13px', border: '1px solid var(--status-missing-border)' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isChanging}
              style={{ padding: '9px 20px', fontSize: '13.5px' }}
            >
              {isChanging ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
