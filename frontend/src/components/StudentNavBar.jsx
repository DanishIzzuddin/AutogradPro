// src/components/StudentNavBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../pages/LecturerDashboard.css';

export default function StudentNavBar() {
  return (
    <aside className="sidebar">
      <h2>AutoGradPro</h2>
      <nav>
        <NavLink to="/student/dashboard" className="nav-link">
          Dashboard
        </NavLink>
        <NavLink to="/student/submissions" className="nav-link">
          My Submissions
        </NavLink>
        <NavLink to="/student/progress" className="nav-link">
          Progress
        </NavLink>
        <NavLink to="/student/account" className="nav-link">
          Account
        </NavLink>
      </nav>
      <button
        className="signout"
        onClick={() => {
          localStorage.removeItem('token');
          window.location.href = '/auth';
        }}
      >
        Sign Out
      </button>
    </aside>
  );
}
