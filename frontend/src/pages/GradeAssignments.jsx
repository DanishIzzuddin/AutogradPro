// src/pages/GradeAssignment.jsx

import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import LecturerNavBar from '../components/LecturerNavBar';
import BackButton from '../components/BackButton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import './LecturerDashboard.css';

export default function GradeAssignment() {
  const [subjects, setSubjects]             = useState([]);
  const [subjectId, setSubjectId]           = useState('');
  const [assignments, setAssignments]       = useState([]);
  const [assignmentId, setAssignmentId]     = useState('');
  const [submissions, setSubmissions]       = useState([]);
  const [submissionId, setSubmissionId]     = useState('');
  const [details, setDetails]               = useState(null);
  const [assignmentType, setAssignmentType] = useState('');

  // ── NEW STATE FOR COLLAPSIBLE FORM ──────────────────────────────
  const [showAdjust, setShowAdjust]     = useState(false);
  const [adjustScore, setAdjustScore]   = useState('');
  const [lectPassword, setLectPassword] = useState('');
  const [adjustError, setAdjustError]   = useState('');

  // 1) load subjects
  useEffect(() => {
    axios.get('/lecturer/subjects')
      .then(r => setSubjects(r.data))
      .catch(console.error);
  }, []);

  // 2) load assignments when subject changes
  useEffect(() => {
    if (!subjectId) return;
    axios.get(`/lecturer/subjects/${subjectId}/assignments`)
      .then(r => {
        setAssignments(r.data);
        // reset downstream state
        setAssignmentId('');
        setSubmissions([]);
        setSubmissionId('');
        setDetails(null);
        setShowAdjust(false);
      })
      .catch(console.error);
  }, [subjectId]);

  // 3) load submissions list
  useEffect(() => {
    if (!assignmentId) return;
    const asg = assignments.find(a => a.id === +assignmentId);
    setAssignmentType(asg?.assignment_type || '');
    axios.get(`/lecturer/assignments/${assignmentId}/submissions`)
      .then(r => setSubmissions(r.data))
      .catch(console.error);
  }, [assignmentId, assignments]);

  // 4) load details when a submission is picked
  useEffect(() => {
    if (!submissionId) return;
    axios.get(`/lecturer/submissions/${submissionId}/details`)
      .then(r => {
        setDetails(r.data);
        setShowAdjust(false);
      })
      .catch(console.error);
  }, [submissionId]);

  // ── TOGGLE COLLAPSIBLE FORM ──────────────────────────────────────
  const handleToggleAdjust = () => {
    setAdjustScore('');
    setLectPassword('');
    setAdjustError('');
    setShowAdjust(v => !v);
  };

  // ── SUBMIT ADJUSTMENT ────────────────────────────────────────────
  const handleAdjustScore = async () => {
    setAdjustError('');
    if (!adjustScore || !lectPassword) {
      setAdjustError('Please enter a new score and your password');
      return;
    }
    try {
      await axios.put(
        `/lecturer/submissions/${submissionId}/score`,
        {
          newScore: Number(adjustScore),
          password: lectPassword
        }
      );
      // refresh details
      const { data } = await axios.get(
        `/lecturer/submissions/${submissionId}/details`
      );
      setDetails(data);
      setShowAdjust(false);
    } catch (err) {
      setAdjustError(err.response?.data?.message || 'Failed to update score');
    }
  };

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">
        <aside className="lecturer-left-panel">
          <div className="nav-box">
            <LecturerNavBar />
          </div>
        </aside>
        <main className="lecturer-right-panel">
          <div className="page-card grade-card">
            <BackButton />

            <h2>Grade Assignment</h2>

            <div className="selectors">
              <div>
                <label>Subject:</label>
                <select
                  value={subjectId}
                  onChange={e => setSubjectId(e.target.value)}
                >
                  <option value="">— choose —</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.code} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {assignments.length > 0 && (
                <div>
                  <label>Assignment:</label>
                  <select
                    value={assignmentId}
                    onChange={e => setAssignmentId(e.target.value)}
                  >
                    <option value="">— choose —</option>
                    {assignments.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {submissions.length > 0 && (
                <div>
                  <label>Student:</label>
                  <select
                    value={submissionId}
                    onChange={e => setSubmissionId(e.target.value)}
                  >
                    <option value="">— choose —</option>
                    {submissions.map(sub => (
                      <option
                        key={sub.submission_id}
                        value={sub.submission_id}
                      >
                        {sub.student_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {details && (
              <>
                <h3>Router Scores</h3>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={Object.entries(details.per_router).map(
                        ([r, info]) => ({ router: r, score: info.score })
                      )}
                      margin={{ top: 10, bottom: 5 }}
                    >
                      <XAxis dataKey="router" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#2e5aac" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <p className="total-score">
                  <strong>Total Score:</strong> {details.total_score}
                </p>

                <h3>Feedback</h3>
                <div className="feedback-container">
                  <ul className="fb-list">
                    {Object.entries(details.per_router).map(([r, info]) => (
                      <li key={r}>
                        <strong>{r}:</strong>
                        <ul>
                          {info.feedback.map((line, i) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* ── COLLAPSIBLE ADJUST SCORE ───────────────────── */}
                <button
                  className="adjust-toggle-btn"
                  onClick={handleToggleAdjust}
                >
                  {showAdjust ? 'Cancel Adjustment' : 'Adjust Score'}
                </button>

                {showAdjust && (
                  <div className="adjust-score">
                    <h3>Adjust Total Score</h3>
                    <div className="adjust-row">
                      <input
                        type="number"
                        placeholder="New score"
                        value={adjustScore}
                        onChange={e => setAdjustScore(e.target.value)}
                      />
                      <input
                        type="password"
                        placeholder="Your password"
                        value={lectPassword}
                        onChange={e => setLectPassword(e.target.value)}
                      />
                      <button onClick={handleAdjustScore}>
                        Update
                      </button>
                    </div>
                    {adjustError && <p className="error">{adjustError}</p>}
                  </div>
                )}

                <div className="download-links">
                  <a
                    className="dl-btn"
                    href={`${process.env.REACT_APP_API_BASE_URL}${details.zipFileUrl}`}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download Config ZIP
                  </a>

                  {assignmentType === 'ospf' && details.neighborUrl && (
                    <a
                      className="dl-btn"
                      href={`${process.env.REACT_APP_API_BASE_URL}${details.neighborUrl}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Neighbor ZIP
                    </a>
                  )}

                  {details.pkaFileUrl && (
                    <a
                      className="dl-btn"
                      href={`${process.env.REACT_APP_API_BASE_URL}${details.pkaFileUrl}`}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PKA
                    </a>
                  )}

                  <a
                    className="dl-btn primary"
                    href={`${process.env.REACT_APP_API_BASE_URL}${details.feedbackPdfUrl}`}
                    download="report.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF Report
                  </a>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
