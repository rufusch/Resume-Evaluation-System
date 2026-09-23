import React from 'react';
import UploadWorkspace from '../components/UploadWorkspace';
import { ArrowRight, Compass, ShieldCheck, Target, Award, Mic, GitBranch } from 'lucide-react';

export default function Home() {
  const scrollToUpload = () => {
    const el = document.getElementById('upload-workspace');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      {/* Hero Section */}
      <section className="hero-section">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'var(--bg-wine-surface)', border: '1px solid var(--border-wine-subtle)', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '600', marginBottom: '20px' }}>
          <Compass size={14} />
          <span>EVALUATE • UNDERSTAND • IMPROVE • PREPARE</span>
        </div>

        <h1 className="hero-headline">
          Know how the world of <span>hiring sees you.</span>
        </h1>

        <p className="hero-supporting">
          Upload your resume and a target job description. Our AI performs evidence-based matching,
          ATS verification, recruiter visibility simulation, and personalized interview preparation.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '48px' }}>
          <button
            onClick={scrollToUpload}
            className="btn-primary"
            style={{ fontSize: '15px', padding: '12px 28px' }}
          >
            <span>Analyze My Resume</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* Upload Workspace Section */}
      <section style={{ marginBottom: '60px' }}>
        <UploadWorkspace />
      </section>

      {/* Key Architectural Pillars */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-cream-title)', marginBottom: '8px' }}>
            Built for Transparent Career Preparation
          </h2>
          <p style={{ color: 'var(--text-cream-muted)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
            No black-box scores or arbitrary 80% pass/fail cutoffs. Every insight is anchored in direct resume evidence.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          <div className="card-wine">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-wine-elevated)', border: '1px solid var(--border-wine-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Target size={20} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '17px', marginBottom: '8px', color: 'var(--text-cream-title)' }}>Evidence-Based Matching</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-cream-muted)', lineHeight: '1.6' }}>
              Classifies job criteria into Full, Partial (with exact gap explained), Not Evidenced, or Uncertain.
            </p>
          </div>

          <div className="card-wine">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-wine-elevated)', border: '1px solid var(--border-wine-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ShieldCheck size={20} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '17px', marginBottom: '8px', color: 'var(--text-cream-title)' }}>Recruiter & ATS Previews</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-cream-muted)', lineHeight: '1.6' }}>
              Simulates the 6-second recruiter glance alongside an automated ATS parsing and keyword density audit.
            </p>
          </div>

          <div className="card-wine">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-wine-elevated)', border: '1px solid var(--border-wine-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <Mic size={20} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '17px', marginBottom: '8px', color: 'var(--text-cream-title)' }}>Interactive Mock Interview</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-cream-muted)', lineHeight: '1.6' }}>
              Generates 5–7 tailored questions. Evaluates both typed answers and verbal speech delivery (pacing, clarity, filler words).
            </p>
          </div>

          <div className="card-wine">
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-wine-elevated)', border: '1px solid var(--border-wine-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <GitBranch size={20} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '17px', marginBottom: '8px', color: 'var(--text-cream-title)' }}>What-If Scenario Simulator</h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-cream-muted)', lineHeight: '1.6' }}>
              Simulate adding a skill, certification, or project to observe immediate coverage impact without altering your real resume.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
