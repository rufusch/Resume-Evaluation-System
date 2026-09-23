import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import { Sparkles, User, LogOut, History, Shield, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { analysisId } = useAnalysis();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/login');
  };

  const currentAnalysisUrl = (base) => {
    return analysisId ? `${base}/${analysisId}` : base;
  };

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-badge">
            <Sparkles size={16} />
          </div>
          <span>Career Lens</span>
        </Link>

        {/* Center Nav Links */}
        <div className="navbar-links">
          <NavLink
            to={currentAnalysisUrl('/analysis')}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Analysis
          </NavLink>
          <NavLink
            to={currentAnalysisUrl('/resume-insights')}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Resume Insights
          </NavLink>
          <NavLink
            to={currentAnalysisUrl('/skill-gaps')}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Skill Gaps
          </NavLink>
          <NavLink
            to={currentAnalysisUrl('/interview')}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            Interview
          </NavLink>
          <NavLink
            to={currentAnalysisUrl('/what-if')}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            What-If
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            My Analyses
          </NavLink>
        </div>

        {/* Right Nav State */}
        <div className="navbar-actions">
          <Link to={isAuthenticated ? "/hr" : "/login?workspace=hr"} className="btn-secondary" style={{ padding: "7px 12px", whiteSpace: "nowrap" }}>HR Dashboard</Link>
          {isAuthenticated ? (
            <div className="user-menu-wrapper" ref={dropdownRef}>
              <button
                className="user-menu-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--btn-cherry-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={13} color="#fdfbf7" />
                </div>
                <span>{user?.name || 'My Account'}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown-menu">
                  <Link
                    to="/history"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <History size={15} />
                    <span>My Analyses</span>
                  </Link>
                  <Link
                    to="/account"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Shield size={15} />
                    <span>Account Settings</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    className="dropdown-item"
                    onClick={handleLogout}
                    style={{ color: '#8c1d1d' }}
                  >
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" className="btn-secondary" style={{ padding: '7px 16px', fontSize: '13.5px' }}>
                Sign In
              </Link>
              <Link to="/signup" className="btn-primary" style={{ padding: '7px 16px', fontSize: '13.5px' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
