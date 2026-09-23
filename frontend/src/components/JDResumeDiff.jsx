import React from 'react';
import { GitCompare, Check, AlertCircle, X, HelpCircle } from 'lucide-react';

export default function JDResumeDiff({ diffItems = [] }) {
  if (!diffItems || diffItems.length === 0) return null;

  return (
    <div className="card-cream" style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GitCompare size={18} color="var(--btn-cherry-bg)" />
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
            JD ↔ Resume Diff
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-wine-muted)' }}>
            Git-style comparison between role expectations and candidate evidence
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontFamily: 'monospace', fontSize: '13px' }}>
        {/* Left column: Job Requirement (+ prefix) */}
        <div style={{ background: '#F8F6F2', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-wine-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Job Requirements (Expected)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diffItems.map((item, idx) => (
              <div
                key={`req-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  background: 'rgba(95, 16, 42, 0.04)',
                  color: 'var(--text-wine-primary)',
                }}
              >
                <span style={{ color: 'var(--btn-cherry-bg)', fontWeight: '700' }}>+</span>
                <span style={{ fontWeight: '600' }}>{item.requirement}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-wine-muted)', marginLeft: 'auto' }}>
                  ({item.category})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Resume Evidence (check, tilde, cross, ?) */}
        <div style={{ background: '#F8F6F2', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
          <div style={{ fontWeight: '700', fontSize: '12px', color: 'var(--text-wine-muted)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
            Resume Evidence (Candidate)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diffItems.map((item, idx) => {
              let icon = <Check size={14} color="#1b5e20" />;
              let bg = 'var(--status-full-bg)';
              let textCol = 'var(--status-full-text)';
              let label = 'Full Match';

              if (item.status === 'PARTIAL MATCH') {
                icon = <AlertCircle size={14} color="#7a5e00" />;
                bg = 'var(--status-partial-bg)';
                textCol = 'var(--status-partial-text)';
                label = 'Partial Evidence';
              } else if (item.status === 'NOT EVIDENCED') {
                icon = <X size={14} color="#8c1d1d" />;
                bg = 'var(--status-missing-bg)';
                textCol = 'var(--status-missing-text)';
                label = 'Not Evidenced';
              } else if (item.status === 'UNCERTAIN') {
                icon = <HelpCircle size={14} color="#5a5248" />;
                bg = 'var(--status-uncertain-bg)';
                textCol = 'var(--status-uncertain-text)';
                label = 'Uncertain';
              }

              return (
                <div
                  key={`ev-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    background: bg,
                    color: textCol,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.evidence}
                >
                  <span>{icon}</span>
                  <span style={{ fontWeight: '600' }}>{item.requirement}</span>
                  <span style={{ fontSize: '11px', opacity: 0.85, marginLeft: 'auto' }}>
                    — {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
