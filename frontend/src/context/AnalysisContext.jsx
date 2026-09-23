import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AnalysisContext = createContext(null);

export function AnalysisProvider({ children }) {
  const [analysisId, setAnalysisIdState] = useState(() => {
    return localStorage.getItem('career_lens_current_analysis_id') || null;
  });
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setAnalysisId = (id) => {
    setAnalysisIdState(id);
    if (id) {
      localStorage.setItem('career_lens_current_analysis_id', id);
    } else {
      localStorage.removeItem('career_lens_current_analysis_id');
      setCurrentAnalysis(null);
    }
  };

  const loadAnalysis = useCallback(async (id) => {
    if (!id) {
      setCurrentAnalysis(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAnalysis(id);
      setCurrentAnalysis(data);
      setAnalysisIdState(id);
      localStorage.setItem('career_lens_current_analysis_id', id);
    } catch (err) {
      console.error('Error loading analysis:', err);
      setError(err.message || "You don't have access to this analysis.");
      setCurrentAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (analysisId && (!currentAnalysis || currentAnalysis.analysis_id !== analysisId)) {
      loadAnalysis(analysisId);
    }
  }, [analysisId, currentAnalysis, loadAnalysis]);

  return (
    <AnalysisContext.Provider
      value={{
        analysisId,
        currentAnalysis,
        setCurrentAnalysis,
        setAnalysisId,
        loadAnalysis,
        loading,
        error,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
