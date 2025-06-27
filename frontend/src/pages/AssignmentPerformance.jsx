// src/pages/AssignmentPerformance.jsx

import React, { useState, useEffect } from 'react';
import { useParams }    from 'react-router-dom';
import axios from '../api/axiosConfig';
import BackButton       from '../components/BackButton';
import LecturerNavBar   from '../components/LecturerNavBar';
import './AssignmentPerformance.css';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function AssignmentPerformance({ onSignOut }) {
  const { id } = useParams();
  const [rawData, setRawData]             = useState([]);
  const [stats, setStats]                 = useState({ average_score: 0 });
  const [filter, setFilter]               = useState('all');
  const [commonMistake, setCommonMistake] = useState('No mistakes recorded');

  useEffect(() => {
    axios.get(
      `/lecturer/assignment-performance/${id}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
    )
    .then(res => {
      // 1) pull stats, coerce average_score to a number
      const incomingStats = res.data.stats || {};
      const avgRaw  = incomingStats.average_score;
      const avgNum  = Number(avgRaw) || 0;
      setStats({ ...incomingStats, average_score: avgNum });

      // 2) raw student rows
      const students = res.data.allStudents || [];
      setRawData(students);

      // 3) find the most frequent “mistake” across all feedback strings
      const freq = {};
      students.forEach(s => {
        if (s.feedback) {
          freq[s.feedback] = (freq[s.feedback] || 0) + 1;
        }
      });
      const most = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
      setCommonMistake(most ? most[0] : 'No mistakes recorded');
    })
    .catch(console.error);
  }, [id]);

  const filtered = rawData
    .filter(s => s.score != null)
    .filter(s => {
      if (filter === 'all')   return true;
      if (filter === 'above') return s.score >  stats.average_score;
      if (filter === 'equal') return s.score === stats.average_score;
      if (filter === 'below') return s.score <  stats.average_score;
      return false;
    });

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">

        {/* sidebar */}
        <aside className="lecturer-left-panel">
          <div className="nav-box">
            <LecturerNavBar onSignOut={onSignOut}/>
          </div>
        </aside>

        {/* main */}
        <main className="lecturer-right-panel">
          <div className="page-card perf-card">
            <BackButton />
            <h2>Assignment Performance</h2>

            {/* CHART */}
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={filtered}
                  margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                  barCategoryGap="30%"
                >
                  <XAxis
                    dataKey="student_name"
                    height={40}
                    tick={{ fontSize: 12 }}
                    interval={0}
                    tickMargin={8}
                    angle={-30}
                    textAnchor="end"
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar
                    dataKey="score"
                    maxBarSize={24}
                    fill="#5995fd"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* FILTER BUTTONS */}
            <div className="filters">
              {['all','above','equal','below'].map(key => (
                <button
                  key={key}
                  className={`filter-btn${filter===key ? ' active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {key==='all'    ? 'All'
                   : key==='above' ? 'Above avg'
                   : key==='equal' ? 'At avg'
                                   : 'Below avg'}
                </button>
              ))}
            </div>

            {/* STUDENT LIST */}
            <ul className="student-list">
              {filtered.map(s => {
                const numScore = Number(s.score) || 0;
                return (
                  <li key={s.student_name}>
                    <span className="stu-name">{s.student_name}</span>
                    <span className="stu-score">{numScore.toFixed(1)}</span>
                  </li>
                );
              })}
            </ul>

            {/* FOOTER SUMMARY */}
            <div className="perf-footer">
              <p>
                <strong>Average score:</strong>{' '}
                {stats.average_score.toFixed(2)}
              </p>
              <p><strong>Most common mistake:</strong></p>
              <p className="common-fb">{commonMistake}</p>
            </div>
          </div>
        </main>

      </div>
    </div>
  );
}
