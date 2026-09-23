import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAnalysis } from '../context/AnalysisContext';
import SpeechRecorder from '../components/SpeechRecorder';
import api from '../services/api';
import { Mic, Send, CheckCircle2, AlertCircle, Award, RefreshCw, ArrowRight, HelpCircle, UserCheck } from 'lucide-react';

export default function Interview() {
  const { analysisId } = useParams();
  const { currentAnalysis, loadAnalysis, loading, error } = useAnalysis();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluations, setEvaluations] = useState({}); // { [questionId]: evalObj }
  const [interviewSummary, setInterviewSummary] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (analysisId && (!currentAnalysis || currentAnalysis.analysis_id !== analysisId)) {
      loadAnalysis(analysisId);
    }
  }, [analysisId, currentAnalysis, loadAnalysis]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid var(--accent-gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-cream-muted)' }}>Preparing interview questions...</p>
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

  const questions = currentAnalysis.interview_questions || [];
  const currentQ = questions[currentQuestionIndex] || null;
  const currentEval = currentQ ? evaluations[currentQ.id] : null;

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!typedAnswer.trim() || isEvaluating) return;

    setIsEvaluating(true);
    try {
      const res = await api.submitInterviewAnswer(analysisId, currentQ.id, typedAnswer.trim());
      setEvaluations((prev) => ({ ...prev, [currentQ.id]: res.evaluation }));
      setTypedAnswer('');
    } catch (err) {
      console.error('Answer submission failed:', err);
      alert(err.message || 'Error evaluating answer.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSpeechComplete = async (transcriptText, speechMetrics) => {
    if (!transcriptText || transcriptText.trim().length < 5) return;

    setIsEvaluating(true);
    try {
      const res = await api.submitInterviewAnswer(analysisId, currentQ.id, transcriptText.trim(), speechMetrics);
      setEvaluations((prev) => ({ ...prev, [currentQ.id]: res.evaluation }));
    } catch (err) {
      console.error('Speech answer submission failed:', err);
      alert(err.message || 'Error evaluating speech answer.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summary = await api.getInterviewSummary(analysisId);
      setInterviewSummary(summary);
      setShowSummary(true);
    } catch (err) {
      console.error('Failed to load interview summary:', err);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '32px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          <Mic size={15} />
          <span>Interactive Mock Interview</span>
        </div>
        <h1 style={{ fontSize: '36px', fontWeight: '700', marginBottom: '8px' }}>
          Prepare for the interview you're actually likely to face.
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-cream-muted)' }}>
          Personalized questions synthesized from your resume, target job description, documented projects, and identified skill gaps.
        </p>
      </div>

      {!showSummary ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* Questions Sidebar List */}
          <div className="card-cream" style={{ padding: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-wine-muted)', letterSpacing: '0.05em', marginBottom: '14px' }}>
              Interview Questions ({questions.length})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {questions.map((q, idx) => {
                const isSelected = idx === currentQuestionIndex;
                const isAnswered = !!evaluations[q.id];

                return (
                  <button
                    key={`q-btn-${q.id}`}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--card-blush)' : '#ffffff',
                      border: `1px solid ${isSelected ? 'var(--btn-cherry-bg)' : 'var(--card-cream-border)'}`,
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-wine-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                        Q{idx + 1} • {q.type}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-wine-primary)', fontWeight: isSelected ? '700' : '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.question}
                      </div>
                    </div>

                    {isAnswered ? (
                      <CheckCircle2 size={16} color="#1B5E20" style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d5c8c0', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Complete Interview Button */}
            <div style={{ marginTop: '24px' }}>
              <button
                onClick={loadSummary}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '13.5px' }}
              >
                <span>View Interview Summary</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Active Question Box & Input */}
          <div>
            {currentQ && (
              <div className="card-cream" style={{ marginBottom: '20px' }}>
                {/* Question Details Header */}
                <div style={{ borderBottom: '1px solid var(--card-cream-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', background: 'var(--card-blush)', color: 'var(--text-blush-dark)', padding: '3px 10px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {currentQ.type} • {currentQ.category}
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)' }}>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-wine-primary)', lineHeight: '1.4' }}>
                    {currentQ.question}
                  </h3>

                  <div style={{ fontSize: '12.5px', color: 'var(--text-wine-muted)', marginTop: '8px' }}>
                    <strong>Interviewer Context:</strong> {currentQ.context}
                  </div>
                </div>

                {/* Speech Input Option */}
                <SpeechRecorder
                  onTranscriptComplete={handleSpeechComplete}
                  isEvaluating={isEvaluating}
                />

                {/* Text Input Form */}
                <form onSubmit={handleTextSubmit} style={{ marginTop: '20px' }}>
                  <label className="form-label" style={{ fontSize: '13.5px', marginBottom: '6px' }}>
                    Or Type Your Answer
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={5}
                    placeholder="Structure your answer with your approach, technologies, trade-offs, and measurable outcomes..."
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-wine-muted)' }}>
                      Suggested focus: {currentQ.suggested_focus?.join(', ')}
                    </div>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isEvaluating || !typedAnswer.trim()}
                      style={{ padding: '8px 20px', fontSize: '13.5px' }}
                    >
                      {isEvaluating ? (
                        <span>Evaluating...</span>
                      ) : (
                        <>
                          <span>Submit Typed Answer</span>
                          <Send size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Instant Evaluation Feedback Display */}
                {currentEval && (
                  <div style={{ marginTop: '24px', background: '#F8F6F2', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--card-cream-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: 'var(--btn-cherry-bg)', fontWeight: '700', fontSize: '15px' }}>
                      <Award size={18} />
                      <span>AI Answer Diagnostic</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-cream-border)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-wine-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Relevance</span>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-wine-primary)', marginTop: '2px' }}>
                          {currentEval.relevance}
                        </div>
                      </div>

                      <div style={{ background: '#ffffff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-cream-border)' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-wine-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Clarity</span>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-wine-primary)', marginTop: '2px' }}>
                          {currentEval.clarity}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)', marginBottom: '8px' }}>
                      <strong>Technical Depth:</strong> {currentEval.technical_depth}
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-wine-secondary)', marginBottom: '12px' }}>
                      <strong>Completeness:</strong> {currentEval.completeness}
                    </div>

                    {/* Speech Feedback if applicable */}
                    {currentEval.speech_feedback && (
                      <div style={{ background: '#FAF0E8', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', border: '1px solid #EED8C6' }}>
                        <div style={{ fontWeight: '700', fontSize: '12.5px', color: 'var(--text-wine-primary)', marginBottom: '4px' }}>
                          🎙 Communication & Delivery Analytics:
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-wine-secondary)' }}>
                          • <strong>Pacing:</strong> {currentEval.speech_feedback.pacing_evaluation}
                        </div>
                        <div style={{ fontSize: '12.5px', color: 'var(--text-wine-secondary)' }}>
                          • <strong>Filler Words:</strong> {currentEval.speech_feedback.filler_evaluation}
                        </div>
                      </div>
                    )}

                    <div style={{ background: 'var(--card-blush)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--text-blush-dark)' }}>
                      <strong>Improvement Advice:</strong> {currentEval.improvement_suggestions}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Final Interview Summary View */
        <div className="card-cream" style={{ maxWidth: '820px', margin: '0 auto 40px', padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--card-blush)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Award size={24} color="var(--btn-cherry-bg)" />
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-wine-primary)', marginBottom: '6px' }}>
              Mock Interview Summary
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-wine-muted)' }}>
              Diagnostic evaluation for {currentAnalysis.job_title}
            </p>
          </div>

          {interviewSummary && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: '#FAF8F5', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-wine-muted)', marginBottom: '4px' }}>
                    Technical Depth
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)' }}>
                    {interviewSummary.technical_depth}
                  </div>
                </div>

                <div style={{ background: '#FAF8F5', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-wine-muted)', marginBottom: '4px' }}>
                    Communication & Delivery
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)' }}>
                    {interviewSummary.communication}
                  </div>
                </div>

                <div style={{ background: '#FAF8F5', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-wine-muted)', marginBottom: '4px' }}>
                    Completeness
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)' }}>
                    {interviewSummary.completeness}
                  </div>
                </div>

                <div style={{ background: '#FAF8F5', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--card-cream-border)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-wine-muted)', marginBottom: '4px' }}>
                    Role Alignment
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-wine-secondary)' }}>
                    {interviewSummary.role_understanding}
                  </div>
                </div>
              </div>

              {/* Areas to Revise */}
              <div style={{ background: '#FFF7F7', border: '1px solid #FFCDD2', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#8C1D1D', marginBottom: '10px' }}>
                  Areas to Revise Prior to Real Interview:
                </div>
                <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#5C1717' }}>
                  {interviewSummary.areas_to_revise.map((area, idx) => (
                    <li key={`rev-${idx}`}>{area}</li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setShowSummary(false)}
                  className="btn-secondary"
                  style={{ color: 'var(--text-wine-primary)', borderColor: 'var(--card-cream-border)' }}
                >
                  Return to Questions
                </button>
                <Link to={`/what-if/${analysisId}`} className="btn-primary">
                  <span>Explore What-If Simulator</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
