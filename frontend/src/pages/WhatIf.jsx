import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import RadarChart from '../components/RadarChart';
import api from '../services/api';
import { Sparkles, GitBranch, ArrowRight, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';

export default function WhatIf() {
  const { analysisId } = useParams();
  const { currentAnalysis, loadAnalysis, loading, error } = useAnalysis();

  const [hypoSkill, setHypoSkill] = useState('');
  const [hypoProject, setHypoProject] = useState('');
  const [hypoCertification, setHypoCertification] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    if (analysisId && (!currentAnalysis || currentAnalysis.analysis_id !== analysisId)) {
      loadAnalysis(analysisId);
    }
  }, [analysisId, currentAnalysis, loadAnalysis]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-cream-muted)' }}>Loading simulation state...</p>
      </div>
    );
  }

  if (error || !currentAnalysis) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="card-cream" style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text-wine-primary)', marginBottom: '12px' }}>Analysis Not Found</h2>
          <Link to="/history" className="btn-primary">Back to My Analyses</Link>
        </div>
      </div>
    );
  }

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!hypoSkill && !hypoProject && !hypoCertification) return;

    setIsSimulating(true);
    try {
      const res = await api.runWhatIf(analysisId, {
        new_skill: hypoSkill || null,
        new_project: hypoProject || null,
        new_certification: hypoCertification || null,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation failed:', err);
      alert(err.message || 'Simulation could not be calculated.');
    } finally {
      setIsSimulating(false);
    }
  };

  const currentRadar = currentAnalysis.radar_data || [];
  const simulatedRadar = simulationResult ? simulationResult.simulated_radar : currentRadar;

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          <GitBranch size={15} />
          <span>Hypothetical Career Modeling</span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
          What if you added one more skill?
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-cream-muted)' }}>
          Test the impact of mastering a missing technology, deploying a portfolio project, or earning a credential.
          <em> (Simulated in memory only — your original resume and saved profile remain untouched.)</em>
        </p>
      </div>

      {/* Input Form Card */}
      <div className="card-cream" style={{ marginBottom: '32px' }}>
        <form onSubmit={handleSimulate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            <div className="form-group">
              <label className="form-label">Hypothetical Skill</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AWS, Kubernetes, Terraform"
                value={hypoSkill}
                onChange={(e) => setHypoSkill(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hypothetical Project</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. High-Concurrency Event Stream Pipeline"
                value={hypoProject}
                onChange={(e) => setHypoProject(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hypothetical Certification</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AWS Solutions Architect Associate"
                value={hypoCertification}
                onChange={(e) => setHypoCertification(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSimulating || (!hypoSkill && !hypoProject && !hypoCertification)}
              style={{ padding: '10px 24px' }}
            >
              {isSimulating ? (
                <span>Simulating Scenario...</span>
              ) : (
                <>
                  <span>Simulate Career Scenario</span>
                  <Sparkles size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Scenario Impact Comparison */}
      {simulationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginBottom: '40px' }}>
          {/* Progression Stats Grid */}
          <div className="stats-grid">
            {/* Required Coverage Delta */}
            <div className="stat-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
              <div className="stat-label">Required Coverage Impact</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-wine-muted)', textDecoration: 'line-through' }}>
                  {simulationResult.current_required_coverage}%
                </span>
                <ArrowRight size={18} color="var(--accent-gold)" />
                <span style={{ fontSize: '28px', fontWeight: '700', color: '#1B5E20' }}>
                  {simulationResult.simulated_required_coverage}%
                </span>
              </div>
              <div className="stat-subtext" style={{ color: '#1B5E20', fontWeight: '600', marginTop: '4px' }}>
                +{simulationResult.simulated_required_coverage - simulationResult.current_required_coverage}% increase in role qualification
              </div>
            </div>

            {/* Assessment Delta */}
            <div className="stat-card" style={{ borderLeft: '4px solid var(--btn-cherry-bg)' }}>
              <div className="stat-label">Qualitative Assessment Shift</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-muted)' }}>
                  {simulationResult.current_assessment}
                </span>
                <ArrowRight size={18} color="var(--btn-cherry-bg)" />
                <span className="assessment-badge" style={{ fontSize: '15px' }}>
                  {simulationResult.simulated_assessment}
                </span>
              </div>
              <div className="stat-subtext">Estimated hiring committee perception</div>
            </div>
          </div>

          {/* Dual Radar Overlay Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '24px' }}>
            <div className="card-cream" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                  Current Profile vs Simulated Profile
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                  Dusty Rose: Current Profile • Champagne Gold: Simulated Profile
                </p>
              </div>
              <RadarChart
                data={simulatedRadar}
                compareMode={true}
                primaryColor="#D4AF37" // Simulated Profile (Gold)
                secondaryColor="#C8879B" // Current Profile (Dusty Rose)
                primaryLabel="Simulated Profile"
                secondaryLabel="Current Profile"
                size={360}
              />
            </div>

            {/* Status Changes Diff */}
            <div className="card-cream">
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '14px' }}>
                Requirement Status Changes
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-wine-muted)', marginBottom: '16px' }}>
                {simulationResult.explanation}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(simulationResult.status_changes || []).map((change, idx) => (
                  <div
                    key={`sc-${idx}`}
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid var(--card-cream-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-wine-primary)' }}>
                        {change.item}
                      </strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span style={{ color: 'var(--text-wine-muted)' }}>{change.old_status}</span>
                        <ArrowRight size={13} color="var(--btn-cherry-bg)" />
                        <span style={{ color: '#1B5E20', fontWeight: '700' }}>{change.new_status}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-wine-secondary)' }}>
                      {change.impact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-wine-surface)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-wine-subtle)', marginBottom: '40px' }}>
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-cream-title)', fontSize: '16px' }}>
            Revisit Past Saved Analyses
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-cream-muted)' }}>
            All completed analyses are stored securely under your authenticated account.
          </div>
        </div>
        <Link to="/history" className="btn-primary">
          <span>My Analyses</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
