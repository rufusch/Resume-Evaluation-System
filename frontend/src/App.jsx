import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnalysisProvider } from './context/AnalysisContext';

import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AnalysisProcessing from './pages/AnalysisProcessing';
import Analysis from './pages/Analysis';
import ResumeInsights from './pages/ResumeInsights';
import SkillGaps from './pages/SkillGaps';
import Interview from './pages/Interview';
import WhatIf from './pages/WhatIf';
import History from './pages/History';
import Account from './pages/Account';
import HR from './pages/HR';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalysisProvider>
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Processing Route */}
                <Route
                  path="/processing/:analysisId"
                  element={
                    <ProtectedRoute>
                      <AnalysisProcessing />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Analysis Routes */}
                <Route
                  path="/analysis"
                  element={
                    <ProtectedRoute>
                      <Analysis />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/analysis/:analysisId"
                  element={
                    <ProtectedRoute>
                      <Analysis />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Resume Insights Routes */}
                <Route
                  path="/resume-insights"
                  element={
                    <ProtectedRoute>
                      <ResumeInsights />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/resume-insights/:analysisId"
                  element={
                    <ProtectedRoute>
                      <ResumeInsights />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Skill Gaps Routes */}
                <Route
                  path="/skill-gaps"
                  element={
                    <ProtectedRoute>
                      <SkillGaps />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/skill-gaps/:analysisId"
                  element={
                    <ProtectedRoute>
                      <SkillGaps />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Mock Interview Routes */}
                <Route
                  path="/interview"
                  element={
                    <ProtectedRoute>
                      <Interview />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/interview/:analysisId"
                  element={
                    <ProtectedRoute>
                      <Interview />
                    </ProtectedRoute>
                  }
                />

                {/* Protected What-If Simulator Routes */}
                <Route
                  path="/what-if"
                  element={
                    <ProtectedRoute>
                      <WhatIf />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/what-if/:analysisId"
                  element={
                    <ProtectedRoute>
                      <WhatIf />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Saved Analyses (History) Route */}
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Account Route */}
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <Account />
                    </ProtectedRoute>
                  }
                />

                {/* Catch-all Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </AnalysisProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
