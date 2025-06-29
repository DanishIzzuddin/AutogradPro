// src/pages/StudentSubmissions.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate }           from 'react-router-dom';
import axios                           from '../api/axiosConfig';
import StudentNavBar                   from '../components/StudentNavBar';
import BackButton                      from '../components/BackButton';
import './LecturerDashboard.css';

export default function StudentSubmissions() {
  const [subjects, setSubjects]       = useState([]);
  const [assignMap, setAssignMap]     = useState({});
  // store for each assignment: { submitted: bool, pdfUrl: string }
  const [submissionInfo, setSubmissionInfo] = useState({});
  const navigate                       = useNavigate();

  useEffect(() => {
    axios.get('/student/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => {
        console.error(err);
        if ([401,403].includes(err.response?.status)) {
          navigate('/auth', { replace: true });
        }
      });
  }, [navigate]);

  const toggleSubject = async sid => {
    if (assignMap[sid]) {
      // collapse
      setAssignMap(m => { const nxt = {...m}; delete nxt[sid]; return nxt; });
    } else {
      // expand & fetch assignments
      const { data: assignments } = await axios.get(`/student/subjects/${sid}/assignments`);
      setAssignMap(m => ({ ...m, [sid]: assignments }));

      // for each assignment, check if a submission exists and grab its PDF URL
      assignments.forEach(a => {
        axios.get(`/student/submission/${a.id}`)
          .then(res => {
            setSubmissionInfo(m => ({
              ...m,
              [a.id]: {
                submitted: true,
                pdfUrl: res.data.feedbackPdfUrl
              }
            }));
          })
          .catch(err => {
            if (err.response?.status === 404) {
              setSubmissionInfo(m => ({
                ...m,
                [a.id]: { submitted: false, pdfUrl: null }
              }));
            } else {
              console.error(err);
            }
          });
      });
    }
  };

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">

        <aside className="lecturer-left-panel">
          <div className="nav-box"><StudentNavBar/></div>
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
                    {assignMap[subj.id].map(a => {
                      const due    = a.due_date ? new Date(a.due_date) : null;
                      const now    = new Date();
                      const isPast = due ? now > due : false;
                      const info   = submissionInfo[a.id] || { submitted: false, pdfUrl: null };

                      return (
                        <li key={a.id} className="assignment-list-item">
                          <div className="assignment-info">
                            <span className="assignment-title">{a.title}</span>
                            {a.description && <p className="assignment-desc">{a.description}</p>}
                            {due
                              ? <small className="assignment-due">Due: {due.toLocaleString()}</small>
                              : <small className="assignment-due">Due date not set</small>
                            }
                          </div>

                          {isPast ? (
                            <button className="assignment-submit disabled" disabled>
                              Past Due
                            </button>

                          ) : info.submitted ? (
                            // direct download link
                            <a
                              href={`${process.env.REACT_APP_API_BASE_URL}${info.pdfUrl}`}
                              download
                              className="assignment-submit"
                            >
                              Download Feedback
                            </a>

                          ) : (
                            <Link
                              to={`/student/submit/${a.id}`}
                              className="assignment-submit"
                            >
                              Submit
                            </Link>
                          )}
                        </li>
                      );
                    })}
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
