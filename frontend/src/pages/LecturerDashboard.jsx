// src/pages/LecturerDashboard.jsx
import React from 'react';
import LecturerNavBar from '../components/LecturerNavBar';
import './LecturerDashboard.css';

export default function LecturerDashboard({ onSignOut }) {
  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">

        <div className="lecturer-left-panel">
          <div className="nav-box">
            <LecturerNavBar onSignOut={onSignOut} />
          </div>
        </div>

        <div className="lecturer-right-panel">
          <div className="page-card">
            <h2>Dashboard Overview</h2>
            <p><strong>How to Use</strong></p>
            <ul>
              <li>
                <strong>Select which course you want to manage</strong><br/>
                View submitted assignments and grade them.
              </li>
              <li>
                <strong>Upload solution files and rubrics</strong><br/>
                These help the system automate grading.
              </li>
              <li>
                <strong>Review student performance logs</strong><br/>
                Track progress and identify students who need help.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
