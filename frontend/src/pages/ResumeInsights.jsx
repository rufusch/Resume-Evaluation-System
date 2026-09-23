import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import JDResumeDiff from '../components/JDResumeDiff';
import { Eye, ShieldCheck, UserCheck, Code, FolderGit2, GraduationCap, Award, AlertTriangle, CheckCircle, Info, ArrowRight } from 'lucide-react';

export default function ResumeInsights() {
  const { analysisId } = useParams();
  const { currentAnalysis, loadAnalysis, loading, error } = useAnalysis();

  const [activeTab, setActiveTab] = useState('normal'); // 'normal' | 'recruiter' | 'ats'

  useEffect(() => {
    if (analysisId && (!currentAnalysis || currentAnalysis.analysis_id !== analysisId)) {
      loadAnalysis(analysisId);
    }
  }, [analysisId, currentAnalysis, loadAnalysis]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-cream-muted)' }}>Loading resume insights...</p>
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

  const profile = currentAnalysis.candidate_profile || {};
  const projects = currentAnalysis.projects || [];
  const recruiterView = currentAnalysis.resume_insights?.recruiter_view || { noticed: [], moderate_attention: [], likely_skipped: [] };
  const atsPreview = currentAnalysis.resume_insights?.ats_preview || { parsed_entities: {}, issues_found: [] };
  const diffItems = currentAnalysis.resume_insights?.diff_items || [];

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '34px', fontWeight: '700', marginBottom: '8px' }}>
            Resume Insights
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-cream-muted)' }}>
            See your resume from every angle: structural breakdown, recruiter scan, and ATS ingestion.
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="tab-group">
          <button
            className={`tab-btn ${activeTab === 'normal' ? 'active' : ''}`}
            onClick={() => setActiveTab('normal')}
          >
            Normal View
          </button>
          <button
            className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            6-Second Recruiter
          </button>
          <button
            className={`tab-btn ${activeTab === 'ats' ? 'active' : ''}`}
            onClick={() => setActiveTab('ats')}
          >
            ATS Parsing Preview
          </button>
        </div>
      </div>

      {/* 1. NORMAL VIEW */}
      {activeTab === 'normal' && (
        <div>
          {/* Candidate Profile Overview */}
          <div className="card-cream" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} color="var(--btn-cherry-bg)" />
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                  {profile.name || 'Candidate Profile'}
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-wine-muted)' }}>
                  {profile.email} {profile.phone ? `• ${profile.phone}` : ''}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-wine-secondary)', lineHeight: '1.6', background: '#F8F6F2', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
              {profile.summary || 'Summary profile identified from document.'}
            </p>

            {/* Skills Pills */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-wine-muted)', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Extracted Competencies & Frameworks
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.values(profile.skills || {}).map((s, idx) => (
                  <span
                    key={`sk-${idx}`}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--card-cream-border)',
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: 'var(--text-wine-primary)',
                    }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Project Understanding (Project -> Technologies -> Role -> Problem -> Solution -> Outcome) */}
          <div className="card-cream" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <FolderGit2 size={20} color="var(--btn-cherry-bg)" />
              <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                AI Project Understanding
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {projects.map((proj, idx) => (
                <div
                  key={`proj-${idx}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--card-cream-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '22px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                        {proj.title}
                      </h4>
                      <span style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                        Role: <strong>{proj.role}</strong>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {proj.technologies.map((t, tIdx) => (
                        <span
                          key={`pt-${tIdx}`}
                          style={{
                            background: 'var(--card-blush)',
                            color: 'var(--text-blush-dark)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Deep Project Breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '12px' }}>
                    <div style={{ background: '#FAF8F5', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-cream-border)' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-wine-muted)', marginBottom: '4px' }}>
                        Problem / Context
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
                        {proj.problem}
                      </div>
                    </div>

                    <div style={{ background: '#FAF8F5', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-cream-border)' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: 'var(--text-wine-muted)', marginBottom: '4px' }}>
                        Solution / Implementation
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
                        {proj.solution}
                      </div>
                    </div>

                    <div style={{ background: '#FAF8F5', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-cream-border)' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', color: '#1B5E20', marginBottom: '4px' }}>
                        Outcome / Impact
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)', fontWeight: '500' }}>
                        {proj.outcome}
                      </div>
                    </div>
                  </div>

                  {/* Interview relevance */}
                  <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-wine-muted)', fontStyle: 'italic' }}>
                    <strong>Interview Relevance:</strong> {proj.interview_relevance}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience & Education */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="card-cream">
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '14px' }}>
                Employment History
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
                {(profile.experience || []).map((exp, idx) => (
                  <li key={`exp-${idx}`}>{exp}</li>
                ))}
              </ul>
            </div>

            <div className="card-cream">
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '14px' }}>
                Education & Certifications
              </h4>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-wine-secondary)' }}>
                {(profile.education || []).map((edu, idx) => (
                  <li key={`edu-${idx}`}>{edu}</li>
                ))}
                {(profile.certifications || []).map((cert, idx) => (
                  <li key={`cert-${idx}`}>{cert}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. RECRUITER 6-SECOND VIEW */}
      {activeTab === 'recruiter' && (
        <div>
          <div className="card-cream" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--btn-cherry-bg)', fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>
                <Eye size={16} />
                <span>Cognitive Skim Simulation</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                6-Second Recruiter View
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-wine-muted)', lineHeight: '1.5' }}>
                Recruiters spend an average of 6 to 7.4 seconds on initial candidate screening.
                This simulation models visual anchors based on typographical hierarchy, layout whitespace, and section positioning.
                <em> (Simulation based on visual hierarchy heuristics; does not claim ocular tracking).</em>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* What gets noticed */}
              <div style={{ background: '#F1F8F2', border: '1px solid #C8E6C9', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1B5E20', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                  <CheckCircle size={17} />
                  <span>What Gets Noticed Immediately</span>
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#1E4620' }}>
                  {recruiterView.noticed.map((item, idx) => (
                    <li key={`not-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Moderate attention */}
              <div style={{ background: '#FFFDF0', border: '1px solid #FFE082', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7A5E00', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                  <Info size={17} />
                  <span>Moderate Secondary Attention</span>
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#5C4600' }}>
                  {recruiterView.moderate_attention.map((item, idx) => (
                    <li key={`mod-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Likely skipped */}
              <div style={{ background: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8C1D1D', fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>
                  <AlertTriangle size={17} />
                  <span>Likely Skipped During Skim</span>
                </div>
                <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#5F1414' }}>
                  {recruiterView.likely_skipped.map((item, idx) => (
                    <li key={`skip-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ATS PARSING PREVIEW */}
      {activeTab === 'ats' && (
        <div>
          <div className="card-cream" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--btn-cherry-bg)', fontWeight: '600', fontSize: '13px', marginBottom: '6px' }}>
                <ShieldCheck size={16} />
                <span>Machine Ingestion Audit</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                ATS Parsing Preview & Entity Extraction
              </h3>
              <p style={{ fontSize: '13.5px', color: 'var(--text-wine-muted)' }}>
                Demonstrates how automated Applicant Tracking Systems parse and index your resume stream.
                Highlights detected entities, potential keyword drop-offs, and formatting integrity.
              </p>
            </div>

            {/* Ingestion Flow: Original -> Parsed -> Issues */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              {/* Entities Extracted */}
              <div style={{ background: '#FAF8F5', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '14px' }}>
                  Detected ATS Entities
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-wine-muted)' }}>Candidate Name:</span>
                    <strong style={{ color: 'var(--text-wine-primary)' }}>{atsPreview.parsed_entities.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-wine-muted)' }}>Contact Email:</span>
                    <strong style={{ color: 'var(--text-wine-primary)' }}>{atsPreview.parsed_entities.email}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-wine-muted)' }}>Indexed Skills Count:</span>
                    <strong style={{ color: 'var(--text-wine-primary)' }}>{atsPreview.parsed_entities.skills_count} skills</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-wine-muted)' }}>Work Milestones:</span>
                    <strong style={{ color: 'var(--text-wine-primary)' }}>{atsPreview.parsed_entities.roles_detected} entries</strong>
                  </div>
                </div>
              </div>

              {/* Parsing Issues Found */}
              <div style={{ background: '#FAF8F5', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '14px' }}>
                  Ingestion Issues & Diagnostics
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {atsPreview.issues_found.map((issue, idx) => (
                    <div
                      key={`iss-${idx}`}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: issue.severity === 'warning' ? 'var(--status-partial-bg)' : '#ffffff',
                        border: `1px solid ${issue.severity === 'warning' ? 'var(--status-partial-border)' : 'var(--card-cream-border)'}`,
                        fontSize: '12.5px',
                        color: issue.severity === 'warning' ? 'var(--status-partial-text)' : 'var(--text-wine-secondary)',
                      }}
                    >
                      <strong style={{ display: 'block', marginBottom: '2px' }}>{issue.issue}</strong>
                      {issue.detail}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Always render the Git-style Diff at the bottom */}
      <JDResumeDiff diffItems={diffItems} />

      {/* Next Actions Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-wine-surface)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-wine-subtle)', marginTop: '36px', marginBottom: '40px' }}>
        <div>
          <div style={{ fontWeight: '600', color: 'var(--text-cream-title)', fontSize: '16px' }}>
            Next: Bridge Critical Skill Gaps
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-cream-muted)' }}>
            Review Expected vs Evidence radar and actionable 5-step preparation roadmap.
          </div>
        </div>
        <Link to={`/skill-gaps/${currentAnalysis.analysis_id}`} className="btn-primary">
          <span>Skill Gaps</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
