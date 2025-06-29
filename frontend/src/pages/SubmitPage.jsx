import React, { useEffect, useState } from 'react';
import axios from '../api/axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import StudentNavBar from '../components/StudentNavBar';
import BackButton from '../components/BackButton';
import { Doughnut, Bar } from 'react-chartjs-2';
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
  const navigate = useNavigate();

  const [type, setType] = useState('');
  const [zipFile, setZipFile] = useState(null);
  const [neighZip, setNeighZip] = useState(null);
  const [pkaFile, setPkaFile] = useState(null);
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [perf, setPerf] = useState(null);
  const [viewFeedback, setViewFeedback] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState('');

  useEffect(() => {
    axios.get(`/student/assignment/${aid}`)
      .then(res => setType(res.data.assignment_type))
      .catch(() => navigate('/student/submissions'));
  }, [aid, navigate]);

  useEffect(() => {
    axios.get(`/student/submission/${aid}`)
      .then(res => {
        const { score, feedback, feedbackPdfUrl } = res.data;
        setResult({ final_score: score, per_router: JSON.parse(feedback) });
        setPdfUrl(feedbackPdfUrl);
      })
      .catch(err => {
        if (err.response?.status !== 404) console.error(err);
      });
  }, [aid]);

  useEffect(() => {
    if (result) {
      axios.get(`/student/assignment/${aid}/performance`)
        .then(res => setPerf(res.data))
        .catch(err => console.error(err));
    }
  }, [result, aid]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!zipFile || !birthday) {
      return setError('Please provide birthday prefix & config ZIP.');
    }
    if (type === 'ospf' && (!neighZip || !pkaFile)) {
      return setError('Neighbor ZIP & .pka required for OSPF.');
    }

    const fd = new FormData();
    fd.append('config_zip', zipFile);
    fd.append('birthdayPrefix', birthday);
    if (type === 'ospf') {
      fd.append('neighbor_zip', neighZip);
      fd.append('pka_file', pkaFile);
    }
    fd.append('assignmentId', aid);

    try {
      const response = await axios.post(
        '/student/upload-config',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success === false && response.data.error) {
        setError(`Submission failed: ${response.data.error}`);
        return;
      }

      setResult(response.data.summary);
      setPdfUrl(response.data.feedbackPdfUrl);
    } catch (err) {
      console.error(err);
      const serverMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Upload failed';
      setError(`Submission failed: ${serverMessage}`);
    }
  };

  if (viewFeedback && result && perf) {
    const bins = Array(10).fill(0);
    perf.scores.forEach(s => bins[Math.min(Math.floor(s / 10), 9)]++);

    return (
      <div className="lecturer-container">
        <div className="lecturer-panels">
          <aside className="lecturer-left-panel">
            <div className="nav-box"><StudentNavBar /></div>
          </aside>
          <main className="lecturer-right-panel">
            <div className="page-card">
              <BackButton onClick={() => navigate('/student/submissions')} />
              <h2>Results & Feedback</h2>

              <div className="top-charts">
                <div className="chart-wrapper">
                  <Doughnut
                    data={{
                      labels: ['You', 'Rest'],
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
                      labels: bins.map((_, i) => `${i * 10}-${i * 10 + 9}`),
                      datasets: [{
                        data: bins,
                        backgroundColor: bins.map((_, i) =>
                          i === Math.min(Math.floor(perf.myScore / 10), 9)
                            ? '#4e73df'
                            : '#eaeaea'
                        )
                      }]
                    }}
                    options={{
                      scales: {
                        x: { title: { display: true, text: 'Score Range' } },
                        y: { title: { display: true, text: '# Students' } }
                      },
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: `Percentile ${perf.percentile}% · Class Avg ${perf.average}%`
                        }
                      },
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>

              <h3>Per-Router Details</h3>
              <div className="feedback-section">
                {Object.entries(result.per_router).map(([router, info]) => (
                  <div key={router} className="router-block">
                    <h4>{router}</h4>
                    <p>Score: {info.score}</p>
                    <ul>
                      {info.feedback.map((line, i) => <li key={i}>{line}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <a
                className="download-btn"
                href={`${process.env.REACT_APP_API_BASE_URL}${pdfUrl}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download PDF Feedback
              </a>
              {downloadMsg && <div className="info-msg">{downloadMsg}</div>}
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">
        <aside className="lecturer-left-panel">
          <div className="nav-box"><StudentNavBar /></div>
        </aside>
        <main className="lecturer-right-panel">
          <div className="page-card">
            <BackButton onClick={() => navigate('/student/submissions')} />
            <h2>Submit {type.toUpperCase()} Assignment</h2>

            {error && <p className="error">{error}</p>}

            {result && perf && !viewFeedback && (
              <button
                className="assignment-submit"
                onClick={() => setViewFeedback(true)}
              >
                View Feedback
              </button>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-field">
                <label>Birthday Prefix</label>
                <input
                  type="text"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                  placeholder="e.g. 20010101"
                />
              </div>

              <div className="input-field">
                <label>Config ZIP</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={e => setZipFile(e.target.files[0])}
                />
              </div>

              {type === 'ospf' && (
                <>
                  <div className="input-field">
                    <label>Neighbor ZIP</label>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={e => setNeighZip(e.target.files[0])}
                    />
                  </div>
                  <div className="input-field">
                    <label>Packet Tracer (.pka)</label>
                    <input
                      type="file"
                      accept=".pka"
                      onChange={e => setPkaFile(e.target.files[0])}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="assignment-submit"
                disabled={!!result}
              >
                Submit
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
