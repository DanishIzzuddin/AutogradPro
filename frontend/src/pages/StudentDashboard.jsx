// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { Link }            from 'react-router-dom';
import StudentNavBar       from '../components/StudentNavBar';
import './LecturerDashboard.css';  // reuse the same layout & sidebar styles

export default function StudentDashboard() {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    axios
      .get('/student/subjects')        // <-- dropped the extra "/api/"
      .then(res => setSubjects(res.data))
      .catch(console.error);
  }, []);

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
            <h2>Your Subjects</h2>
            {subjects.length === 0 ? (
              <p>You are not enrolled in any subjects yet.</p>
            ) : (
              <ul>
                {subjects.map(s => (
                  <li key={s.id}>
                    <Link to={`/student/subjects/${s.id}/assignments`}>
                      {s.code} – {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
