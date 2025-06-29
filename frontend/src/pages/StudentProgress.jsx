// src/pages/StudentProgress.jsx
import React, { useState, useEffect } from 'react';
import axios                        from '../api/axiosConfig';
import { useNavigate }              from 'react-router-dom';
import StudentNavBar                from '../components/StudentNavBar';
import BackButton                   from '../components/BackButton';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer
} from 'recharts';
import './AssignmentPerformance.css';

export default function StudentProgress() {
  const navigate = useNavigate();

  const [subjects, setSubjects]       = useState([]);
  const [subjectId, setSubjectId]     = useState(null);
  const [data, setData]               = useState([]);
  const [selectedId, setSelectedId]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  // 1) load subjects
  useEffect(() => {
    axios.get('/student/subjects')
      .then(res => {
        setSubjects(res.data);
        if (res.data.length) {
          setSubjectId(res.data[0].id);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load subjects.');
        if ([401,403].includes(err.response?.status)) {
          navigate('/auth', { replace: true });
        }
      });
  }, [navigate]);

  // 2) load assignments + submission scores whenever subject changes
  useEffect(() => {
    if (!subjectId) return;
    setLoading(true);
    setError('');
    axios.get(`/student/subjects/${subjectId}/assignments`)
      .then(res =>
        Promise.all(
          res.data.map(a =>
            axios.get(`/student/submission/${a.id}`)
              .then(r => ({
                id:       a.id,
                name:     a.title,
                score:    Number(r.data.score) || 0,
                feedback: JSON.parse(r.data.feedback || '{}')
              }))
              .catch(err => {
                // if 404 => no submission yet, skip it
                if (err.response?.status === 404) return null;
                console.error(err);
                return null;
              })
          )
        )
      )
      .then(arr => {
        const pts = arr.filter(x => x !== null);
        setData(pts);
        if (pts.length) {
          setSelectedId(pts[0].id);
        } else {
          setSelectedId(null);
        }
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load your submissions.');
      })
      .finally(() => setLoading(false));
  }, [subjectId, navigate]);

  const selectedEntry = data.find(d => d.id === selectedId);

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">

        {/* Sidebar */}
        <aside className="lecturer-left-panel">
          <div className="nav-box">
            <StudentNavBar />
          </div>
        </aside>

        {/* Main */}
        <main className="lecturer-right-panel">
          <div className="page-card perf-card">
            <BackButton onClick={() => navigate('/student/dashboard')} />
            <h2>My Progress</h2>

            {error && <p className="error">{error}</p>}

            {/* Subject selector */}
            <div className="perf-controls">
              <label>Subject:</label>
              <select
                value={subjectId || ''}
                onChange={e => setSubjectId(Number(e.target.value))}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            {loading && <p>Loading your progress…</p>}

            {!loading && data.length === 0 && (
              <p>You have not submitted any assignments yet for this subject.</p>
            )}

            {data.length > 0 && (
              <>
                {/* Chart */}
                <div className="chart-wrapper" style={{ height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={40}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#4e73df"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Assignment selector */}
                <div className="perf-controls">
                  <label>Assignment:</label>
                  <select
                    value={selectedId || ''}
                    onChange={e => setSelectedId(Number(e.target.value))}
                  >
                    {data.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Feedback */}
                {selectedEntry && (
                  <div
                    className="feedback-container"
                    style={{ maxHeight: '300px', overflowY: 'auto', marginTop: '1rem' }}
                  >
                    <h3>Feedback for "{selectedEntry.name}"</h3>
                    {Object.entries(selectedEntry.feedback).map(([router, info]) => (
                      <div key={router} className="router-block">
                        <h4>{router}</h4>
                        <ul>
                          {info.feedback.map((line, i) => <li key={i}>{line}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}
