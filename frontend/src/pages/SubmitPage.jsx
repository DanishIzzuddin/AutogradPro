// src/pages/SubmitPage.jsx

import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { useParams }               from 'react-router-dom';
import StudentNavBar               from '../components/StudentNavBar';
import { Doughnut, Bar }           from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title as ChartTitle
} from 'chart.js';
import './LecturerDashboard.css';

// register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  ChartTitle
);

export default function SubmitPage() {
  const { aid } = useParams();

  const [type, setType]         = useState('');
  const [zipFile, setZipFile]   = useState(null);
  const [neighZip, setNeighZip] = useState(null);
  const [pkaFile, setPkaFile]   = useState(null);
  const [birthday, setBirthday] = useState('');
  const [error, setError]       = useState('');
  const [result, setResult]     = useState(null);
  const [pdfUrl, setPdfUrl]     = useState('');
  const [perf, setPerf]         = useState(null);

  // 1) load assignment type
  useEffect(() => {
    axios
      .get(`/student/assignment/${aid}`)
      .then(res => setType(res.data.assignment_type))
      .catch(() => setError('Failed to load assignment info'));
  }, [aid]);

  // 2) check existing submission
  useEffect(() => {
    axios
      .get(`/student/submission/${aid}`)
      .then(res => {
        const { score, feedback, feedbackPdfUrl } = res.data;
        setResult({
          final_score: score,
          per_router: JSON.parse(feedback)
        });
        setPdfUrl(feedbackPdfUrl);
      })
      .catch(err => {
        if (err.response?.status !== 404) console.error(err);
      });
  }, [aid]);

  // 3) fetch performance after grading
  useEffect(() => {
    if (result) {
      axios
        .get(`/student/assignment/${aid}/performance`)
        .then(res => setPerf(res.data))
        .catch(err => console.error(err));
    }
  }, [result, aid]);

  // 4) render feedback + charts
  if (result && perf) {
    // build histogram bins
    const bins = Array(10).fill(0);
    perf.scores.forEach(s => {
      bins[Math.min(Math.floor(s / 10), 9)]++;
    });

    return (
      <div className="lecturer-container">
        <div className="lecturer-panels">
          <aside className="lecturer-left-panel">
            <div className="nav-box"><StudentNavBar/></div>
          </aside>
          <main className="lecturer-right-panel">
            <div className="page-card">

              {/* ── Top row: Donut & Histogram side by side ── */}
              <div className="top-charts">
                <div className="chart-wrapper">
                  <Doughnut
                    data={{
                      labels: ['You','Remaining'],
                      datasets: [{
                        data: [perf.myScore, 100 - perf.myScore],
                        backgroundColor: ['#4e73df', '#eaeaea']
                      }]
                    }}
                    options={{
                      cutout: '80%',
                      plugins: { legend: { display: false } },
                      maintainAspectRatio: false
                    }}
                  />
                  <div className="chart-center-text">{perf.myScore}%</div>
                </div>

                <div className="chart-wrapper">
                  <Bar
                    data={{
                      labels: bins.map((_, i) => `${i*10}-${i*10+9}`),
                      datasets: [{
                        label: 'Students',
                        data: bins,
                        backgroundColor: bins.map((_,i) =>
                          i === Math.min(Math.floor(perf.myScore/10),9)
                            ? '#4e73df'
                            : '#eaeaea'
                        )
                      }]
                    }}
                    options={{
                      scales: {
                        x: { title: { display: true, text: 'Score Range' } },
                        y: { title: { display: true, text: '# of Students' } }
                      },
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: `Your percentile: ${perf.percentile}%, class avg: ${perf.average}`
                        }
                      },
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>

              {/* ── Scrollable feedback beneath ── */}
              <h3>Per-Router Details:</h3>
              <div className="feedback-container">
                {Object.entries(result.per_router).map(([router, info]) => (
                  <div key={router} className="router-block">
                    <h4>{router}</h4>
                    <p>Score: {info.score}</p>
                    <ul>
                      {info.feedback.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* DOWNLOAD PDF */}
              <a
                className="download-btn"
                href={`${process.env.REACT_APP_API_BASE_URL}${pdfUrl}`}
                download="feedback.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF Feedback
              </a>

            </div>
          </main>
        </div>
      </div>
    );
  }

  // 5) otherwise, show the submission form
  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!zipFile || !birthday) {
      setError('Please select a ZIP and enter birthday prefix.');
      return;
    }
    const formData = new FormData();
    formData.append('config_zip', zipFile);
    formData.append('birthdayPrefix', birthday);
    if (type === 'ospf') {
      if (neighZip) formData.append('neighbor_zip', neighZip);
      if (pkaFile)   formData.append('pka_file', pkaFile);
    }
    formData.append('assignmentId', aid);

    try {
      const { data } = await axios.post(
        '/student/upload-config',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setResult(data.summary);
      setPdfUrl(data.feedbackPdfUrl);
    } catch (err) {
      console.error(err);
      setError('Upload failed: ' + (err.response?.data?.message || err.message));
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

            <h2>Submit {type.toUpperCase()} Assignment</h2>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
              <label>
                Birthday Prefix:
                <input
                  type="text"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  required
                />
              </label>
              <label>
                Config ZIP:
                <input
                  type="file"
                  accept=".zip"
                  onChange={e => setZipFile(e.target.files[0])}
                  required
                />
              </label>
              {type === 'ospf' && (
                <>
                  <label>
                    Neighbor ZIP:
                    <input
                      type="file"
                      accept=".zip"
                      onChange={e => setNeighZip(e.target.files[0])}
                    />
                  </label>
                  <label>
                    Packet Tracer (.pka) File:
                    <input
                      type="file"
                      accept=".pka"
                      onChange={e => setPkaFile(e.target.files[0])}
                    />
                  </label>
                </>
              )}
              <button type="submit">Submit</button>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
