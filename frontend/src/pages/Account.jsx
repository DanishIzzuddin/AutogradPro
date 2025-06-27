// src/pages/Account.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate }            from 'react-router-dom';
import axios                      from '../api/axiosConfig';
import StudentNavBar              from '../components/StudentNavBar';
import LecturerNavBar             from '../components/LecturerNavBar';
import BackButton                 from '../components/BackButton';
import './LecturerDashboard.css';

export default function Account({ onSignOut }) {
  const navigate       = useNavigate();
  const [profile, setProfile]         = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg]                 = useState('');

  useEffect(() => {
    axios.get('/me')
      .then(r => setProfile(r.data))
      .catch(console.error);
  }, []);

  if (!profile) return null;

  const saveProfile = async e => {
    e.preventDefault();
    const { name, email, age } = profile;
    try {
      await axios.put('/me', { name, email, age });
      setMsg('Profile updated successfully.');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error saving profile');
    }
  };

  const changePassword = async e => {
    e.preventDefault();
    try {
      await axios.put('/me/password', { oldPassword, newPassword });
      setMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error changing password');
    }
  };

  // pick the right NavBar
  const Nav = profile.role === 'lecturer' ? LecturerNavBar : StudentNavBar;

  return (
    <div className="lecturer-container">
      <div className="lecturer-panels">
        <aside className="lecturer-left-panel">
          <div className="nav-box">
            <Nav onSignOut={onSignOut} />
          </div>
        </aside>
        <main className="lecturer-right-panel">
          <div className="page-card perf-card">
            <BackButton onClick={() => navigate(-1)} />

            <h2>Hi {profile.name}, welcome to the Automated Grading System!</h2>
            {msg && <p className="info">{msg}</p>}

            <form onSubmit={saveProfile}>
              <h3>Update Profile</h3>
              <label>
                Name:
                <input
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                />
              </label>
              <label>
                Age:
                <input
                  type="number"
                  value={profile.age || ''}
                  onChange={e => setProfile({ ...profile, age: e.target.value })}
                />
              </label>
              <button type="submit">Save Profile</button>
            </form>

            <form onSubmit={changePassword}>
              <h3>Change Password</h3>
              <label>
                Old Password:
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                />
              </label>
              <label>
                New Password:
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  pattern="(?=.*\d)(?=.*[A-Z]).{8,}"
                  title="At least 8 chars, one uppercase letter and one number"
                  required
                />
              </label>
              <button type="submit">Update Password</button>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
