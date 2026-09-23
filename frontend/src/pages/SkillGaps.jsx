import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import RadarChart from '../components/RadarChart';
import { Target, BookOpen, Hammer, Award, ExternalLink, ArrowRight, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

export default function SkillGaps() {
  const { analysisId } = useParams();
  const { currentAnalysis, loadAnalysis, loading, error } = useAnalysis();

  useEffect(() => {
    if (analysisId && (!currentAnalysis || currentAnalysis.analysis_id !== analysisId)) {
      loadAnalysis(analysisId);
    }
  }, [analysisId, currentAnalysis, loadAnalysis]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-cream-muted)' }}>Loading skill gap analysis...</p>
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

  const skillGaps = currentAnalysis.skill_gaps || { high_priority: [], medium_priority: [], strong_areas: [], roadmap: {} };
  const roadmap = skillGaps.roadmap || {};
  const radarData = currentAnalysis.radar_data || [];

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          <Target size={15} />
          <span>Actionable Preparation</span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
          Turn insights into progress.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-cream-muted)' }}>
          Prioritized preparation roadmap comparing explicit JD requirements against verified resume evidence.
        </p>
      </div>

      {/* Dual Radar Chart & Explanatory Box */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 440px) 1fr', gap: '24px', marginBottom: '36px' }}>
        <div className="card-cream" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
              Target vs Evidence Gap
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
              Champagne Gold: Expected JD Requirement • Dusty Rose: Resume Evidence
            </p>
          </div>
          <RadarChart
            data={radarData}
            compareMode={true}
            primaryColor="#C8879B" // Dusty Rose (User evidence)
            secondaryColor="#D4AF37" // Champagne Gold (Expected JD)
            primaryLabel="Resume Evidence"
            secondaryLabel="Expected JD Requirement"
            size={360}
          />
        </div>

        {/* Philosophy Card */}
        <div className="card-blush" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--btn-cherry-bg)', fontWeight: '700', fontSize: '15px', marginBottom: '12px' }}>
            <Sparkles size={18} />
            <span>Important Distinction: Evidence vs Capability</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-wine-primary)', lineHeight: '1.6', marginBottom: '14px' }}>
            User values in this comparison reflect <strong>resume evidence</strong>, not your actual ceiling or capability.
            Recruiters and automated systems evaluate what is explicitly verifiable in project descriptions and metrics.
          </p>
          <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-blush-border)', fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
            <strong>Action Rule:</strong> Prioritize adding concrete bullet points and code references for High Priority items rather than listing dozens of unevidenced keywords.
          </div>
        </div>
      </div>

      {/* Prioritized Gaps Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '36px' }}>
        {/* High Priority Gaps */}
        <div className="card-cream">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--status-missing-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={17} color="var(--status-missing-text)" />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                High Priority Skill Gaps
              </h3>
              <span style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                Directly requested in JD requirements with minimal or unconfirmed resume evidence
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {(skillGaps.high_priority || []).map((gap, idx) => (
              <div
                key={`hp-${idx}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--card-cream-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                    {gap.requirement}
                  </h4>
                  <span className="status-pill status-missing">Missing / Low</span>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)', marginBottom: '10px' }}>
                  <strong>Gap:</strong> {gap.gap}
                </div>

                <div style={{ background: '#FAF6F2', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--text-wine-secondary)' }}>
                  <strong style={{ color: 'var(--btn-cherry-bg)' }}>Recommendation:</strong> {gap.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medium Priority & Strong Areas Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Medium Priority */}
          <div className="card-cream">
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '14px' }}>
              Medium Priority (Nice-to-Have)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(skillGaps.medium_priority || []).map((gap, idx) => (
                <div key={`mp-${idx}`} style={{ background: '#ffffff', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-wine-primary)', marginBottom: '4px' }}>
                    {gap.requirement}
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                    {gap.recommendation}
                  </div>
                </div>
              ))}
              {(!skillGaps.medium_priority || skillGaps.medium_priority.length === 0) && (
                <div style={{ fontSize: '13px', color: 'var(--text-wine-muted)', fontStyle: 'italic' }}>
                  No secondary gaps detected.
                </div>
              )}
            </div>
          </div>

          {/* Strong Areas */}
          <div className="card-cream">
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1B5E20', marginBottom: '14px' }}>
              Verified Strong Areas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(skillGaps.strong_areas || []).map((item, idx) => (
                <div key={`sa-${idx}`} style={{ background: '#F1F8F2', border: '1px solid #C8E6C9', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '14px', color: '#1B5E20', marginBottom: '4px' }}>
                    <CheckCircle2 size={15} />
                    <span>{item.requirement}</span>
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#2A552C' }}>
                    {item.advantage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Improvement Roadmap */}
      <div className="card-cream" style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <BookOpen size={20} color="var(--btn-cherry-bg)" />
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
            Personalized Improvement Roadmap
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* What to Learn */}
          <div style={{ background: '#FAF8F5', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--btn-cherry-bg)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} />
              <span>What to Learn Next</span>
            </div>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
              {(roadmap.what_to_learn || []).map((item, idx) => (
                <li key={`wtl-${idx}`}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Recommended Sequence */}
          <div style={{ background: '#FAF8F5', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--btn-cherry-bg)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} />
              <span>Preparation Sequence</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
              {(roadmap.sequence || []).map((step, idx) => (
                <div key={`seq-${idx}`}>{step}</div>
              ))}
            </div>
          </div>

          {/* Certifications to Consider */}
          <div style={{ background: '#FAF8F5', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '18px' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--btn-cherry-bg)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} />
              <span>Certifications to Consider</span>
            </div>
            <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
              {(roadmap.certifications_to_consider || []).map((c, idx) => (
                <li key={`cert-${idx}`}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Suggested Micro-Projects */}
        <div>
          <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-wine-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hammer size={16} color="var(--btn-cherry-bg)" />
            <span>Targeted Portfolio Projects to Build</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {(roadmap.projects_to_build || []).map((p, idx) => (
              <div key={`pb-${idx}`} style={{ background: '#ffffff', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-wine-primary)', marginBottom: '4px' }}>
                  {p.title}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)', marginBottom: '8px' }}>
                  {p.description}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {p.tech_stack.map((t, tIdx) => (
                    <span key={`tech-${tIdx}`} style={{ background: 'var(--card-blush)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--text-blush-dark)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Actions Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-wine-surface)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-wine-subtle)', marginBottom: '40px' }}>
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-cream-title)', fontSize: '16px' }}>
            Next: Practice Tailored Mock Interview
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-cream-muted)' }}>
            Answer 5–7 questions using text or verbal speech, with instant delivery feedback.
          </div>
        </div>
        <Link to={`/interview/${currentAnalysis.analysis_id}`} className="btn-primary">
          <span>Start Interview</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
