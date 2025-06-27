// src/pages/StudentPerformance.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import LecturerNavBar from '../components/LecturerNavBar';
import BackButton from '../components/BackButton';
import '../style.css';
import './AssignmentPerformance.css';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList
} from 'recharts';

export default function StudentPerformance({ onSignOut }) {
  const navigate = useNavigate();
  const [subjects, setSubjects]       = useState([]);
  const [subjectId, setSubjectId]     = useState(null);
  const [performance, setPerformance] = useState([]);

  // 1. load subjects (lecturer’s roster)
  useEffect(() => {
    // NOTE: axiosConfig already attaches the JWT for you,
    // so no need to pass headers here.
    axios.get('/lecturer/subjects')
      .then(res => {
        setSubjects(res.data);
        if (res.data.length) setSubjectId(res.data[0].id);
      })
      .catch(console.error);
  }, []);

  // 2. load assignments & their stats for the selected subject
  useEffect(() => {
    if (!subjectId) return;

    axios.get(`/lecturer/subjects/${subjectId}/assignments`)
      .then(res =>
        Promise.all(
          res.data.map(a =>
            axios
              .get(`/lecturer/assignment-performance/${a.id}`)
              .then(r => {
                const avg = parseFloat(r.data.stats.average_score) || 0;
                const pct = parseFloat(r.data.stats.percentile)    || 0;
                return {
                  id:            a.id,
                  title:         a.title,
                  average_score: avg.toFixed(1),
                  total_subs:    r.data.stats.total_submissions || 0,
                  percentile:    pct.toFixed(0)
                };
              })
          )
        )
      )
      .then(all => setPerformance(all))
      .catch(console.error);
  }, [subjectId]);

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">

        {/* sidebar */}
        <aside className="lecturer-left-panel">
          <div className="nav-box">
            <LecturerNavBar onSignOut={onSignOut} />
          </div>
        </aside>

        {/* main content */}
        <main className="lecturer-right-panel">
          <div className="page-card perf-card">
            <BackButton onClick={() => navigate('/lecturer/dashboard')} />
            <h2>Student Performance</h2>

            {/* subject picker */}
            <div className="perf-controls">
              <label htmlFor="subject-select">Subject:</label>
              <select
                id="subject-select"
                value={subjectId || ''}
                onChange={e => setSubjectId(+e.target.value)}
              >
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.code} – {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* performance chart */}
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={performance}
                  margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="title"
                    height={40}
                    tick={{ fontSize: 12 }}
                    interval={0}
                    tickMargin={8}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="average_score" maxBarSize={24}>
                    <LabelList dataKey="average_score" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* assignment list with badges */}
            <ul className="perf-assignment-list">
              {performance.map(a => (
                <li key={a.id}>
                  <span className="asgn-title">{a.title}</span>
                  <span className="asgn-badge">
                    {a.total_subs} submissions, percentile: {a.percentile}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </main>

      </div>
    </div>
  );
}
