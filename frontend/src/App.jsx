// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import SignInSignUp           from './pages/SignInSignUp';
import LecturerDashboard      from './pages/LecturerDashboard';
import ViewSubmissions        from './pages/ViewSubmissions';
import NewAssignment          from './pages/NewAssignment';
import AssignmentPerformance  from './pages/AssignmentPerformance';
import StudentPerformance     from './pages/StudentPerformance'; 
import StudentProgress        from './pages/StudentProgress';     
import GradeAssignments       from './pages/GradeAssignments';
import Account                from './pages/Account';
import StudentDashboard       from './pages/StudentDashboard';
import StudentSubmissions     from './pages/StudentSubmissions';
import SubmitPage             from './pages/SubmitPage';

export default function App() {
  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Authentication */}
        <Route path="/auth" element={<SignInSignUp />} />

        {/* Student routes */}
        <Route
          path="/student/dashboard"
          element={<StudentDashboard onSignOut={handleSignOut} />}
        />
        <Route
          path="/student/submissions"
          element={<StudentSubmissions onSignOut={handleSignOut} />}
        />
        <Route
          path="/student/submit/:aid"
          element={<SubmitPage onSignOut={handleSignOut} />}
        />
        <Route
          path="/student/progress"
          element={<StudentProgress onSignOut={handleSignOut} />}
        />
        <Route
          path="/student/account"
          element={<Account onSignOut={handleSignOut} />}
        />

        {/* Lecturer routes */}
        <Route
          path="/lecturer/dashboard"
          element={<LecturerDashboard onSignOut={handleSignOut} />}
        />
        <Route
          path="/lecturer/submissions"
          element={<ViewSubmissions onSignOut={handleSignOut} />}
        />
        <Route
          path="/lecturer/subjects/:subjectId/new"
          element={<NewAssignment onSignOut={handleSignOut} />}
        />
        <Route
          path="/lecturer/submissions/:id"
          element={<AssignmentPerformance onSignOut={handleSignOut} />}
        />
        <Route
          path="/lecturer/performance"
          element={<StudentPerformance onSignOut={handleSignOut} />}
        />
        <Route
          path="/lecturer/grade"
          element={<GradeAssignments onSignOut={handleSignOut} />}
        />
        <Route
          path="/lecturer/account"
          element={<Account onSignOut={handleSignOut} />}
        />

        {/* Fallback: redirect anything else to /auth */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
