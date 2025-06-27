// src/components/LecturerNavBar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../pages/LecturerDashboard.css';

export default function LecturerNavBar({ onSignOut }) {
  const navigate = useNavigate();

  const handleSignOut = () => {
    if (typeof onSignOut === 'function') {
      onSignOut();
    } else {
      localStorage.removeItem('token');
      navigate('/auth', { replace: true });
    }
  };

  return (
    <aside className="sidebar">
      <h2>AutoGradPro</h2>
      <nav>
        <NavLink to="/lecturer/dashboard"   className="nav-link">Dashboard</NavLink>
        <NavLink to="/lecturer/submissions" className="nav-link">View Submissions</NavLink>
        <NavLink to="/lecturer/performance" className="nav-link">Student Performance</NavLink>
        <NavLink to="/lecturer/grade"       className="nav-link">Grade Assignments</NavLink>
        <NavLink to="/lecturer/account"     className="nav-link">Account</NavLink>
      </nav>
      <button className="signout" onClick={handleSignOut}>
        Sign Out
      </button>
    </aside>
  );
}
