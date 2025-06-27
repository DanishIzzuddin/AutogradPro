// src/pages/ViewSubmissions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate }     from 'react-router-dom';
import axios from '../api/axiosConfig';
import LecturerNavBar      from '../components/LecturerNavBar';  // updated import
import BackButton          from '../components/BackButton';
import './LecturerDashboard.css';

export default function ViewSubmissions({ onSignOut }) {
  const [subjects, setSubjects] = useState([]);
  const [openMap, setOpenMap]   = useState({});
  const navigate                = useNavigate();

  useEffect(() => {
    // fetch via the /api prefix
    axios.get('/lecturer/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => console.error(err));
  }, []);

  const toggle = async subj => {
    if (!openMap[subj.id]) {
      // fetch assignments with /api prefix
      const res = await axios.get(`/lecturer/subjects/${subj.id}/assignments`);
      setOpenMap(m => ({ ...m, [subj.id]: res.data }));
    } else {
      setOpenMap(m => {
        const nxt = { ...m };
        delete nxt[subj.id];
        return nxt;
      });
    }
  };

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
            <BackButton />
            <h2>View Submissions</h2>

            {subjects.map(subj => (
              <div key={subj.id} className="subject-block">
                <div className="subject-header">
                  <span
                    className="subject-toggle"
                    onClick={() => toggle(subj)}
                  >
                    {openMap[subj.id] ? '▼' : '▶'} {subj.code} – {subj.name}
                  </span>

                  <button
                    className="btn add-btn"
                    onClick={() => navigate(`/lecturer/subjects/${subj.id}/new`)}
                  >
                    + ADD
                  </button>
                </div>

                {openMap[subj.id] && (
                  <ul className="assignment-list">
                    {openMap[subj.id].map(a => (
                      <li key={a.id}>
                        <a
                          href={`/lecturer/submissions/${a.id}`}
                          className="subject-item"
                        >
                          {a.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

          </div>
        </div>

      </div>
    </div>
  );
}
