// src/pages/SignInSignUp.jsx

import React, { useState } from 'react';
import { useNavigate }       from 'react-router-dom';
import axios                 from '../api/axiosConfig';
import { jwtDecode }         from 'jwt-decode';      // ← named import
import logSvg                from '../assets/log.svg';
import registerSvg           from '../assets/register.svg';
import '../style.css';

export default function SignInSignUp() {
  const [mode, setMode]               = useState('signin');
  const [loginError, setLoginError]   = useState('');
  const [signupError, setSignupError] = useState('');
  const navigate                      = useNavigate();

  // SIGN IN
  const handleSignIn = async e => {
    e.preventDefault();
    setLoginError('');

    const form     = e.target;
    const email    = form.loginEmail.value.trim();
    const password = form.loginPassword.value.trim();

    if (!email || !password) {
      return setLoginError('Email and password are required');
    }

    try {
      const { data } = await axios.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);

      const { role } = jwtDecode(data.token);
      if (role === 'student') {
        navigate('/student/dashboard', { replace: true });
      } else {
        navigate('/lecturer/dashboard', { replace: true });
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed');
    }
  };

  // SIGN UP
  const handleSignUp = async e => {
    e.preventDefault();
    setSignupError('');

    const form  = e.target;
    const name  = form.newUsername.value.trim();
    const email = form.newEmail.value.trim();
    const pw    = form.newPassword.value.trim();

    if (!name || !email || !pw) {
      return setSignupError('All fields are required');
    }

    // enforce strong password on client
    const strongRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongRegex.test(pw)) {
      return setSignupError(
        'Password must be at least 8 characters long, include one uppercase letter and one number.'
      );
    }

    try {
      await axios.post('/auth/register', { name, email, password: pw });
      setMode('signin');
    } catch (err) {
      setSignupError(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className={`container ${mode === 'signup' ? 'sign-up-mode' : ''}`}>
      <div className="forms-container">
        <div className="signin-signup">

          {/* Sign In Form */}
          <form className="sign-in-form" onSubmit={handleSignIn}>
            <h2 className="title">Sign In</h2>
            {loginError && <p className="error">{loginError}</p>}
            <div className="input-field">
              <i className="fas fa-envelope" />
              <input name="loginEmail" type="email" placeholder="Email" required />
            </div>
            <div className="input-field">
              <i className="fas fa-lock" />
              <input name="loginPassword" type="password" placeholder="Password" required />
            </div>
            <input type="submit" value="Login" className="btn solid" />
          </form>

          {/* Sign Up Form */}
          <form className="sign-up-form" onSubmit={handleSignUp}>
            <h2 className="title">Sign Up</h2>
            {signupError && <p className="error">{signupError}</p>}
            <div className="input-field">
              <i className="fas fa-user" />
              <input name="newUsername" type="text" placeholder="Username" required />
            </div>
            <div className="input-field">
              <i className="fas fa-envelope" />
              <input name="newEmail" type="email" placeholder="Email" required />
            </div>
            <div className="input-field">
              <i className="fas fa-lock" />
              <input
                name="newPassword"
                type="password"
                placeholder="Password"
                required
                pattern="(?=.*\d)(?=.*[A-Z]).{8,}"
                title="At least 8 chars, one uppercase letter and one number"
              />
            </div>
            <input type="submit" value="Sign Up" className="btn solid" />
          </form>

        </div>
      </div>

      {/* Panels */}
      <div className="panels-container">
        <div className="panel left-panel">
          <div className="content">
            <h3>New here?</h3>
            <p>Join us and submit assignments today!</p>
            <button className="btn transparent" onClick={() => setMode('signup')}>
              Sign Up
            </button>
          </div>
          <img src={logSvg} className="image" alt="Log In Illustration" />
        </div>
        <div className="panel right-panel">
          <div className="content">
            <h3>One of us?</h3>
            <p>Already have an account? Sign in!</p>
            <button className="btn transparent" onClick={() => setMode('signin')}>
              Sign In
            </button>
          </div>
          <img src={registerSvg} className="image" alt="Sign Up Illustration" />
        </div>
      </div>
    </div>
  );
}
