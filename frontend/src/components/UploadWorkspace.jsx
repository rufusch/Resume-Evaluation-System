import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAnalysis } from '../context/AnalysisContext';
import api from '../services/api';
import { UploadCloud, FileText, CheckCircle, X, ArrowRight, AlertCircle } from 'lucide-react';

export default function UploadWorkspace() {
  const { isAuthenticated } = useAuth();
  const { setAnalysisId } = useAnalysis();
  const navigate = useNavigate();

  // Resume State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDragOver, setResumeDragOver] = useState(false);
  const resumeInputRef = useRef(null);

  // Job Description State
  const [jdTab, setJdTab] = useState('paste'); // 'paste' | 'upload'
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [jdDragOver, setJdDragOver] = useState(false);
  const jdInputRef = useRef(null);

  // Form Processing State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Resume selection
  const handleResumeSelect = (file) => {
    if (!file) return;
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setErrorMessage(`Please upload a supported file: PDF, DOC, DOCX, or TXT (uploaded: ${file.name})`);
      return;
    }
    setResumeFile(file);
    setErrorMessage('');
  };

  // Handle JD File selection
  const handleJdFileSelect = (file) => {
    if (!file) return;
    setJdFile(file);
    setErrorMessage('');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please sign in to analyze your resume.' } });
      return;
    }

    if (!resumeFile) {
      setErrorMessage('Please upload your resume to continue.');
      return;
    }

    if (jdTab === 'paste' && (!jdText || jdText.trim().length < 25)) {
      setErrorMessage('Please paste the job description (at least a few sentences) before continuing.');
      return;
    }

    if (jdTab === 'upload' && !jdFile) {
      setErrorMessage('Please select a job description document to upload.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('resume_file', resumeFile);
      if (jdTab === 'paste') {
        formData.append('jd_text', jdText);
      } else if (jdFile) {
        formData.append('jd_file', jdFile);
      }

      const res = await api.uploadAnalysis(formData);
      if (res && res.analysis_id) {
        setAnalysisId(res.analysis_id);
        navigate(`/processing/${res.analysis_id}`);
      } else {
        throw new Error("We couldn't complete the analysis. Please try again.");
      }
    } catch (err) {
      console.error('Analysis submission failed:', err);
      setErrorMessage(err.message || "We couldn't complete the analysis. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-cream" id="upload-workspace" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <form onSubmit={handleAnalyze}>
        {errorMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--status-missing-bg)', color: 'var(--status-missing-text)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', fontSize: '14px', border: '1px solid var(--status-missing-border)' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="upload-grid">
          {/* 1. Resume Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '15px' }}>
                Your Resume
              </label>
              <span style={{ fontSize: '12px', color: 'var(--text-wine-muted)' }}>
                PDF, DOCX, DOC, TXT
              </span>
            </div>

            {!resumeFile ? (
              <div
                className="dropzone-box"
                onDragOver={(e) => { e.preventDefault(); setResumeDragOver(true); }}
                onDragLeave={() => setResumeDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setResumeDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleResumeSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => resumeInputRef.current?.click()}
                style={{
                  borderColor: resumeDragOver ? 'var(--accent-gold)' : 'var(--card-cream-border)',
                  background: resumeDragOver ? 'rgba(212, 175, 55, 0.08)' : '#ffffff',
                }}
              >
                <input
                  type="file"
                  ref={resumeInputRef}
                  style={{ display: 'none' }}
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => handleResumeSelect(e.target.files?.[0])}
                />
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <UploadCloud size={24} color="var(--btn-cherry-bg)" />
                </div>
                <div style={{ fontWeight: '600', color: 'var(--text-wine-primary)', marginBottom: '4px' }}>
                  Click to browse or drag resume
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                  Upload candidate profile document
                </div>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={22} color="var(--btn-cherry-bg)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-wine-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {resumeFile.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-wine-muted)' }}>
                      {(resumeFile.size / 1024).toFixed(1)} KB • {resumeFile.name.split('.').pop()?.toUpperCase()}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    style={{ padding: '6px', color: 'var(--text-wine-muted)', borderRadius: '4px' }}
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => resumeInputRef.current?.click()}
                    style={{ fontSize: '12.5px', color: 'var(--btn-cherry-bg)', fontWeight: '600', textDecoration: 'underline' }}
                  >
                    Replace File
                  </button>
                  <input
                    type="file"
                    ref={resumeInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={(e) => handleResumeSelect(e.target.files?.[0])}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Job Description Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ fontSize: '15px' }}>
                Job Description
              </label>
              <div className="tab-group" style={{ background: 'var(--card-cream-subtle)' }}>
                <button
                  type="button"
                  className={`tab-btn ${jdTab === 'paste' ? 'active' : ''}`}
                  onClick={() => setJdTab('paste')}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  className={`tab-btn ${jdTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setJdTab('upload')}
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                >
                  Upload File
                </button>
              </div>
            </div>

            {jdTab === 'paste' ? (
              <textarea
                className="form-textarea"
                rows={7}
                placeholder="Paste the target role's job description, requirements, or responsibilities here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                style={{ resize: 'vertical', height: '180px' }}
              />
            ) : (
              <div>
                {!jdFile ? (
                  <div
                    className="dropzone-box"
                    onDragOver={(e) => { e.preventDefault(); setJdDragOver(true); }}
                    onDragLeave={() => setJdDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setJdDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleJdFileSelect(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => jdInputRef.current?.click()}
                    style={{
                      borderColor: jdDragOver ? 'var(--accent-gold)' : 'var(--card-cream-border)',
                      background: jdDragOver ? 'rgba(212, 175, 55, 0.08)' : '#ffffff',
                    }}
                  >
                    <input
                      type="file"
                      ref={jdInputRef}
                      style={{ display: 'none' }}
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={(e) => handleJdFileSelect(e.target.files?.[0])}
                    />
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                      <FileText size={24} color="var(--btn-cherry-bg)" />
                    </div>
                    <div style={{ fontWeight: '600', color: 'var(--text-wine-primary)', marginBottom: '4px' }}>
                      Upload Job Description document
                    </div>
                    <div style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                      PDF, DOCX, or TXT
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ffffff', border: '1px solid var(--card-cream-border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={22} color="var(--btn-cherry-bg)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-wine-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {jdFile.name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-wine-muted)' }}>
                          {(jdFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setJdFile(null)}
                        style={{ padding: '6px', color: 'var(--text-wine-muted)', borderRadius: '4px' }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ fontSize: '16px', padding: '14px 36px', borderRadius: 'var(--radius-full)' }}
          >
            {isSubmitting ? (
              <span>Extracting & Comparing Evidence...</span>
            ) : (
              <>
                <span>Analyze My Profile</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
