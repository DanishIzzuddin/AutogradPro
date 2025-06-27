// src/pages/StudentSubmissions.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate }         from 'react-router-dom';
import axios from '../api/axiosConfig';
import StudentNavBar                 from '../components/StudentNavBar';
import BackButton                    from '../components/BackButton';
import './LecturerDashboard.css';

export default function StudentSubmissions() {
  const [subjects, setSubjects]   = useState([]);
  const [assignMap, setAssignMap] = useState({});
  const navigate                   = useNavigate();

  useEffect(() => {
    axios
      .get('/student/subjects')           // no extra "/api/" here
      .then(res => setSubjects(res.data))
      .catch(err => {
        console.error(err);
        if ([401, 403].includes(err.response?.status)) {
          navigate('/auth', { replace: true });
        }
      });
  }, [navigate]);

  const toggleSubject = async sid => {
    if (assignMap[sid]) {
      setAssignMap(m => {
        const nxt = { ...m };
        delete nxt[sid];
        return nxt;
      });
    } else {
      const res = await axios.get(
        `/student/subjects/${sid}/assignments`
      );
      setAssignMap(m => ({ ...m, [sid]: res.data }));
    }
  };

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">
        <aside className="lecturer-left-panel">
          <div className="nav-box">
            <StudentNavBar />
          </div>
        </aside>
        <main className="lecturer-right-panel">
          <div className="page-card">
            <BackButton onClick={() => navigate('/student/dashboard')} />
            <h2>My Submissions</h2>

            {subjects.map(subj => (
              <div key={subj.id} className="subject-block">
                <div
                  className="subject-header"
                  onClick={() => toggleSubject(subj.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {assignMap[subj.id] ? '▼' : '▶'} {subj.code} – {subj.name}
                </div>

                {assignMap[subj.id] && (
                  <ul className="assignment-list">
                    {assignMap[subj.id].map(a => (
                      <li key={a.id}>
                        <Link
                          to={`/student/submit/${a.id}`}
                          className="subject-item"
                        >
                          {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

          </div>
        </main>
      </div>
    </div>
  );
}
