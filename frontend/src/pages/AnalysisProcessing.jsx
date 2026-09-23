import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import api from '../services/api';
import { CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

export default function AnalysisProcessing() {
  const { analysisId } = useParams();
  const { loadAnalysis } = useAnalysis();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');

  const steps = [
    { id: 'upload', label: 'Resume uploaded' },
    { id: 'extract', label: 'Resume text extracted' },
    { id: 'jd_reqs', label: 'Job requirements identified' },
    { id: 'match', label: 'Matching skills with evidence' },
    { id: 'recruiter', label: 'Analyzing recruiter visibility' },
    { id: 'career', label: 'Preparing career insights' },
  ];

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const res = await api.getAnalysisStatus(analysisId);
        if (res && res.status === 'completed') {
          // Advance visual steps smoothly to completion
          for (let i = 0; i <= steps.length; i++) {
            if (!isMounted) return;
            setActiveStep(i);
            await new Promise((r) => setTimeout(r, 280));
          }

          // Load full analysis into context and navigate
          await loadAnalysis(analysisId);
          if (isMounted) {
            navigate(`/analysis/${analysisId}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Status check error:', err);
        if (isMounted) {
          setError(err.message || "We couldn't complete the analysis. Please try again.");
        }
      }
    }

    checkStatus();

    return () => {
      isMounted = false;
    };
  }, [analysisId, navigate, loadAnalysis]);

  return (
    <div className="container" style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card-cream" style={{ maxWidth: '520px', width: '100%', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Loader2 size={24} color="var(--btn-cherry-bg)" style={{ animation: 'spin 1.5s linear infinite' }} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '8px' }}>
            Analyzing your profile
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-wine-muted)', lineHeight: '1.5' }}>
            We're comparing your resume with the requirements for this role.
          </p>
        </div>

        {error ? (
          <div style={{ background: 'var(--status-missing-bg)', color: 'var(--status-missing-text)', padding: '14px 16px', borderRadius: 'var(--radius-md)', fontSize: '13.5px', border: '1px solid var(--status-missing-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#F8F6F2', padding: '24px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
            {steps.map((step, idx) => {
              const isCompleted = idx < activeStep;
              const isCurrent = idx === activeStep;

              return (
                <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: isCurrent ? '600' : '500', color: isCompleted ? '#1B5E20' : isCurrent ? 'var(--text-wine-primary)' : 'var(--text-wine-muted)' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={18} color="#1B5E20" />
                  ) : isCurrent ? (
                    <Loader2 size={18} color="var(--accent-gold)" style={{ animation: 'spin 1.2s linear infinite' }} />
                  ) : (
                    <Circle size={18} color="#d5c8c0" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
