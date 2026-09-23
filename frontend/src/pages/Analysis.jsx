import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import RadarChart from '../components/RadarChart';
import StatusBadge from '../components/StatusBadge';
import CareerBrief from '../components/CareerBrief';
import { Briefcase, Building, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Analysis() {
  const { analysisId } = useParams();
  const { currentAnalysis, loadAnalysis, loading, error } = useAnalysis();

  const [filterCategory, setFilterCategory] = useState('ALL');

  useEffect(() => {
    if (analysisId && (!currentAnalysis || currentAnalysis.analysis_id !== analysisId)) {
      loadAnalysis(analysisId);
    }
  }, [analysisId, currentAnalysis, loadAnalysis]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-cream-muted)' }}>Loading analysis details...</p>
      </div>
    );
  }

  if (error || !currentAnalysis) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div className="card-cream" style={{ maxWidth: '520px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--text-wine-primary)', marginBottom: '12px' }}>
            {error || 'Analysis Not Found'}
          </h2>
          <p style={{ color: 'var(--text-wine-muted)', marginBottom: '20px', fontSize: '14px' }}>
            {error ? error : "The requested analysis is either missing or belongs to another user account."}
          </p>
          <Link to="/history" className="btn-primary">
            View My Analyses
          </Link>
        </div>
      </div>
    );
  }

  const requirements = currentAnalysis.requirements || [];
  const filteredReqs = filterCategory === 'ALL'
    ? requirements
    : requirements.filter((r) => filterCategory === 'PREFERRED' ? r.is_preferred : !r.is_preferred);

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          <Briefcase size={15} />
          <span>Role Fit Assessment</span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '10px' }}>
          Here's how your profile fits this role.
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-cream-muted)', fontSize: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: 'var(--text-cream-title)', fontWeight: '600' }}>{currentAnalysis.job_title}</span>
          </div>
          {currentAnalysis.company && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>•</span>
              <Building size={14} />
              <span>{currentAnalysis.company}</span>
            </div>
          )}
          <span>•</span>
          <span>Resume: {currentAnalysis.resume_filename}</span>
        </div>
      </div>

      {/* Top Metrics Grid */}
      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">Overall Assessment</div>
          <div style={{ marginTop: '8px' }}>
            <span className="assessment-badge" style={{ fontSize: '16px', padding: '6px 18px' }}>
              {currentAnalysis.assessment}
            </span>
          </div>
          <div className="stat-subtext" style={{ marginTop: '8px' }}>
            Qualitative evidence-based fit
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Required Coverage</div>
          <div className="stat-value" style={{ color: 'var(--text-wine-primary)' }}>
            {currentAnalysis.required_coverage}%
          </div>
          <div className="stat-subtext">Must-have criteria verified in resume</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Preferred Coverage</div>
          <div className="stat-value" style={{ color: 'var(--text-wine-primary)' }}>
            {currentAnalysis.preferred_coverage}%
          </div>
          <div className="stat-subtext">Bonus / secondary competencies evidenced</div>
        </div>
      </div>

      {/* Main Split: Radar Graph & AI Career Brief */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '24px', marginBottom: '36px' }}>
        {/* Radar Chart Card */}
        <div className="card-cream" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
              Competency Radar
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
              Analytical visualization in Champagne Gold
            </p>
          </div>
          <RadarChart
            data={currentAnalysis.radar_data || []}
            primaryColor="#D4AF37"
            primaryLabel="Resume Evidence"
            size={360}
          />
        </div>

        {/* AI Career Brief Card */}
        <div>
          <CareerBrief brief={currentAnalysis.career_brief} />
        </div>
      </div>

      {/* Requirement Coverage Breakdown */}
      <div className="card-cream" style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
              Requirement Coverage Breakdown
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-wine-muted)' }}>
              Every requirement is verified against direct evidence in your resume.
            </p>
          </div>

          <div className="tab-group" style={{ background: '#F4EFEB' }}>
            <button
              className={`tab-btn ${filterCategory === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterCategory('ALL')}
            >
              All Requirements ({requirements.length})
            </button>
            <button
              className={`tab-btn ${filterCategory === 'REQUIRED' ? 'active' : ''}`}
              onClick={() => setFilterCategory('REQUIRED')}
            >
              Required
            </button>
            <button
              className={`tab-btn ${filterCategory === 'PREFERRED' ? 'active' : ''}`}
              onClick={() => setFilterCategory('PREFERRED')}
            >
              Preferred / Nice-to-Have
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredReqs.map((req, idx) => (
            <div
              key={`req-item-${idx}`}
              style={{
                background: '#ffffff',
                border: '1px solid var(--card-cream-border)',
                borderRadius: 'var(--radius-md)',
                padding: '18px 20px',
                display: 'grid',
                gridTemplateColumns: 'minmax(220px, 280px) 140px 1fr',
                alignItems: 'start',
                gap: '16px',
              }}
            >
              {/* Requirement Name & Type */}
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text-wine-primary)', fontSize: '14.5px' }}>
                  {req.requirement}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', background: 'var(--card-blush)', color: 'var(--text-blush-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                    {req.category}
                  </span>
                  {req.is_preferred && (
                    <span style={{ fontSize: '11px', background: '#F0EBE1', color: '#6A5E54', padding: '2px 8px', borderRadius: '4px', fontWeight: '500' }}>
                      Preferred
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div>
                <StatusBadge status={req.status} />
              </div>

              {/* Explanation & Evidence / Gap */}
              <div style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)', lineHeight: '1.5' }}>
                <div>{req.explanation}</div>

                {req.resume_evidence && (
                  <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#1b5e20', background: 'var(--status-full-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Evidence:</strong> "{req.resume_evidence}"
                  </div>
                )}

                {req.gap && (
                  <div style={{ marginTop: '6px', fontSize: '12.5px', color: '#8c1d1d', background: 'var(--status-missing-bg)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <strong>Specific Gap:</strong> {req.gap}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Actions Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-wine-surface)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-wine-subtle)', marginBottom: '40px' }}>
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-cream-title)', fontSize: '16px' }}>
            Next: Dive into Multi-Angle Resume Insights
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-cream-muted)' }}>
            Inspect the 6-Second Recruiter glance, ATS parsing preview, and Git-style JD diff.
          </div>
        </div>
        <Link to={`/resume-insights/${currentAnalysis.analysis_id}`} className="btn-primary">
          <span>Resume Insights</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
