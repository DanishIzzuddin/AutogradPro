// src/pages/NewAssignment.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosConfig';
import BackButton from '../components/BackButton';
import './LecturerDashboard.css';

export default function NewAssignment() {
  const { subjectId } = useParams();
  const navigate      = useNavigate();

  const [title, setTitle]                   = useState('');
  const [description, setDescription]       = useState('');
  const [dueDate, setDueDate]               = useState('');
  const [pkaFile, setPkaFile]               = useState(null);
  const [masterZip, setMasterZip]           = useState(null);
  const [masterNeighZip, setMasterNeighZip] = useState(null);
  const [assignmentType, setAssignmentType] = useState('static');
  const [error, setError]                   = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!title || !dueDate) {
      return setError('Title and due date are required');
    }
    if (!pkaFile) {
      return setError('Please upload a .pka file');
    }
    if (!masterZip) {
      return setError('Please upload the master config ZIP');
    }
    if (assignmentType === 'ospf' && !masterNeighZip) {
      return setError('Please upload the master neighbor ZIP for OSPF');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('due_date', dueDate);
    formData.append('assignment_type', assignmentType);
    formData.append('pka_file', pkaFile);
    formData.append('master_zip', masterZip);
    if (masterNeighZip) {
      formData.append('master_neigh_zip', masterNeighZip);
    }

    try {
      await axios.post(
        `/lecturer/subjects/${subjectId}/assignments`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      navigate('/lecturer/submissions');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">
        <div className="lecturer-right-panel">
          <div className="page-card" style={{ maxWidth: '600px', margin: 'auto' }}>
            <BackButton />
            <h2>New Assignment</h2>
            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="input-field">
                <i className="fas fa-file-alt" />
                <input
                  type="text"
                  placeholder="Assignment Title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="input-field">
                <i className="fas fa-align-left" />
                <textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Due date/time */}
              <div className="input-field">
                <i className="fas fa-calendar-alt" />
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                />
              </div>

              {/* Assignment type */}
              <div className="input-field">
                <i className="fas fa-cog" />
                <select
                  value={assignmentType}
                  onChange={e => setAssignmentType(e.target.value)}
                >
                  <option value="static">Static Routing</option>
                  <option value="ospf">OSPF Routing</option>
                </select>
              </div>

              {/* PKA file upload */}
              <div className="input-wrapper">
                <label htmlFor="pka-file" className="file-label">
                  PKA File:
                </label>
                <div className="input-field">
                  <i className="fas fa-file-archive" />
                  <input
                    id="pka-file"
                    type="file"
                    accept=".pka"
                    onChange={e => setPkaFile(e.target.files[0])}
                    required
                  />
                </div>
              </div>

              {/* Master config ZIP */}
              <div className="input-wrapper">
                <label htmlFor="master-zip" className="file-label">
                  Master Config ZIP:
                </label>
                <div className="input-field">
                  <i className="fas fa-file-zipper" />
                  <input
                    id="master-zip"
                    type="file"
                    accept=".zip"
                    onChange={e => setMasterZip(e.target.files[0])}
                    required
                  />
                </div>
              </div>

              {/* Master neighbor ZIP (only for OSPF) */}
              {assignmentType === 'ospf' && (
                <div className="input-wrapper">
                  <label htmlFor="master-neigh-zip" className="file-label">
                    Master Neighbor ZIP:
                  </label>
                  <div className="input-field">
                    <i className="fas fa-network-wired" />
                    <input
                      id="master-neigh-zip"
                      type="file"
                      accept=".zip"
                      onChange={e => setMasterNeighZip(e.target.files[0])}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn solid">
                Create
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
