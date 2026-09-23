import React from 'react';
import { Compass, CheckCircle2, AlertTriangle, Eye, ArrowUpRight } from 'lucide-react';

export default function CareerBrief({ brief }) {
  if (!brief) return null;

  return (
    <div
      style={{
        background: '#FAF6F0',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid #EBE0D2',
        padding: '30px',
        color: 'var(--text-wine-primary)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Compass size={20} color="var(--btn-cherry-bg)" />
        </div>
        <div>
          <h3 style={{ fontSize: '20px', color: 'var(--text-wine-primary)', fontWeight: '700' }}>
            AI Career Brief
          </h3>
          <span style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
            Recruiter perspective, structural fit, and preparation focus
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Overall Fit */}
        <div style={{ background: '#ffffff', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--btn-cherry-bg)', fontWeight: '600', fontSize: '13.5px' }}>
            <Compass size={16} />
            <span>Overall Fit Assessment</span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)', lineHeight: '1.6' }}>
            {brief.overall_fit}
          </p>
        </div>

        {/* Strongest Evidence */}
        <div style={{ background: '#ffffff', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#1B5E20', fontWeight: '600', fontSize: '13.5px' }}>
            <CheckCircle2 size={16} />
            <span>Strongest Evidenced Areas</span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)', lineHeight: '1.6' }}>
            {brief.strongest_evidence}
          </p>
        </div>

        {/* Important Gaps */}
        <div style={{ background: '#ffffff', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#8C1D1D', fontWeight: '600', fontSize: '13.5px' }}>
            <AlertTriangle size={16} />
            <span>Critical Missing or Partial Gaps</span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)', lineHeight: '1.6' }}>
            {brief.important_gaps}
          </p>
        </div>

        {/* Recruiter Concerns */}
        <div style={{ background: '#ffffff', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#7A5E00', fontWeight: '600', fontSize: '13.5px' }}>
            <Eye size={16} />
            <span>Recruiter Visibility Concerns</span>
          </div>
          <p style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)', lineHeight: '1.6' }}>
            {brief.recruiter_concerns}
          </p>
        </div>
      </div>

      {/* Preparation Priorities Banner */}
      <div style={{ marginTop: '20px', background: 'var(--card-blush)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-blush-border)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <ArrowUpRight size={18} color="var(--btn-cherry-bg)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <span style={{ fontWeight: '700', fontSize: '13.5px', color: 'var(--text-wine-primary)', marginRight: '6px' }}>
            Immediate Preparation Priority:
          </span>
          <span style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)' }}>
            {brief.preparation_priorities}
          </span>
        </div>
      </div>
    </div>
  );
}
