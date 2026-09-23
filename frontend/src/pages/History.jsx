import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import api from '../services/api';
import { Briefcase, Building, Calendar, FileText, ArrowRight, Trash2, AlertCircle } from 'lucide-react';

export default function History() {
  const { setAnalysisId } = useAnalysis();
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnalyses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listAnalyses();
      setAnalyses(res.analyses || []);
    } catch (err) {
      console.error('Failed to list analyses:', err);
      setError(err.message || 'Could not retrieve your saved analyses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleOpenAnalysis = (id) => {
    setAnalysisId(id);
    navigate(`/analysis/${id}`);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.deleteAnalysis(deleteTargetId);
      setAnalyses((prev) => prev.filter((a) => a.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      alert(err.message || 'Could not delete analysis.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-cream-muted)' }}>Loading your saved analyses...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
          Your Analyses
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-cream-muted)' }}>
          Revisit your previous resume-to-role analyses.
        </p>
      </div>

      {error && (
        <div style={{ background: 'var(--status-missing-bg)', color: 'var(--status-missing-text)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontSize: '14px', border: '1px solid var(--status-missing-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {analyses.length === 0 ? (
        <div className="card-cream" style={{ maxWidth: '520px', margin: '40px auto', textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={26} color="var(--btn-cherry-bg)" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '8px' }}>
            No analyses yet
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-wine-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            Upload your resume and a job description to create your first analysis.
          </p>
          <Link to="/" className="btn-primary" style={{ padding: '12px 28px' }}>
            <span>Analyze My Resume</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        /* Analyses List */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          {analyses.map((analysis) => {
            const formattedDate = new Date(analysis.created_at).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });

            return (
              <div
                key={analysis.id}
                className="card-cream"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '24px',
                  position: 'relative',
                }}
              >
                <div>
                  {/* Job Title & Company */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '4px' }}>
                        {analysis.job_title}
                      </h3>
                      {analysis.company && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-wine-muted)' }}>
                          <Building size={13} />
                          <span>{analysis.company}</span>
                        </div>
                      )}
                    </div>
                    <span className="assessment-badge" style={{ fontSize: '12px', padding: '3px 10px' }}>
                      {analysis.assessment}
                    </span>
                  </div>

                  {/* Metadata Date & Resume */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12.5px', color: 'var(--text-wine-muted)', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      <span>Analyzed {formattedDate}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={13} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {analysis.resume_filename}
                      </span>
                    </div>
                  </div>

                  {/* Coverage Stats Mini-Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#F8F6F2', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-wine-muted)', fontWeight: '600' }}>
                        Required Coverage
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                        {analysis.required_coverage}%
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-wine-muted)', fontWeight: '600' }}>
                        Preferred Coverage
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-wine-primary)' }}>
                        {analysis.preferred_coverage}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--card-cream-border)', paddingTop: '14px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(analysis.id)}
                    style={{ color: '#8c1d1d', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12.5px', fontWeight: '500' }}
                    title="Delete analysis"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAnalysis(analysis.id)}
                    className="btn-primary"
                    style={{ padding: '7px 16px', fontSize: '13px' }}
                  >
                    <span>View Analysis</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(18, 4, 11, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: '20px' }}>
          <div className="card-cream" style={{ maxWidth: '420px', width: '100%', padding: '28px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--status-missing-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Trash2 size={24} color="#8c1d1d" />
            </div>
            <h3 style={{ fontSize: '19px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '8px' }}>
              Delete this analysis?
            </h3>
            <p style={{ fontSize: '13.5px', color: 'var(--text-wine-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
              This will permanently remove the saved analysis and mock interview responses from your account.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteTargetId(null)}
                style={{ color: 'var(--text-wine-primary)', borderColor: 'var(--card-cream-border)', padding: '9px 18px' }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmDelete}
                style={{ background: '#8c1d1d', padding: '9px 20px' }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
