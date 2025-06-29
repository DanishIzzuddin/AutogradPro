// src/pages/StudentDashboard.jsx
import React from 'react';
import StudentNavBar from '../components/StudentNavBar';
import './LecturerDashboard.css';  // reuse the same layout & sidebar styles

export default function StudentDashboard() {
  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">

        {/* Left sidebar panel */}
        <div className="lecturer-left-panel">
          <div className="nav-box">
            <StudentNavBar />
          </div>
        </div>

        {/* Right main content panel */}
        <div className="lecturer-right-panel">
          <div className="page-card">

            {/* Welcome Header */}
            <h1>Welcome to AutoGradPro</h1>
            <p>
              Your one-stop platform for automating the grading of
              Cisco Packet Tracer and GNS3 assignments.
            </p>

            {/* Dashboard Overview */}
            <h2>Dashboard Overview</h2>
            <ul>
              <li>Submit your network configuration assignments</li>
              <li>Track the status of your submissions in real time</li>
              <li>Download detailed PDF feedback reports</li>
              <li>View your score history and class percentile</li>
            </ul>

            {/* Submission Instructions */}
            <h2>How to Submit an Assignment</h2>
            <p>
              AutoGradPro requires that you export the running-configuration
              from each router in Packet Tracer or GNS3 as a <code>.txt</code>
              file. Once you have one <code>.txt</code> per router, bundle them
              all into a single <code>.zip</code> archive. <strong>Do not</strong>{' '}
              include the proprietary <code>.pka</code> file itself—only your
              exported <code>.txt</code> configs.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}
