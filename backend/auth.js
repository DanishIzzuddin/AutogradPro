// backend/auth.js
require('dotenv').config();
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('./db');      // promise-based pool

const router  = express.Router();

// ─── REGISTER ─────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  // ─── strong password enforcement ────────────────────────────────
  // at least 8 chars, one uppercase letter, one digit
  const strongRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongRegex.test(password)) {
    return res.status(400).json({
      message:
        'Password must be at least 8 characters long and include at least one uppercase letter and one number.'
    });
  }

  // Determine role by email domain
  let role;
  if (email.endsWith('@mmu.edu.my')) {
    role = 'student';
  } else if (email.endsWith('@gmail.com')) {
    role = 'lecturer';
  } else {
    return res.status(400).json({ message: 'Email must be a @mmu.edu.my or @gmail.com address' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const sql  = `
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(sql, [name, email, hash, role]);
    return res.status(201).json({ message: `Registration successful as ${role}` });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    return res.status(500).json({ message: err.message });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const sql = `SELECT id, name, email, password, role FROM users WHERE email = ?`;
    const [results] = await db.query(sql, [email]);

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Sign JWT with role included
    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1h' }
    );

    // Return token + user info
    return res.json({
      token,
      name:  user.name,
      email: user.email,
      role:  user.role
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─── JWT AUTHENTICATION MIDDLEWARE ────────────────────────────────────
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = payload;   // attach { sub, role, iat, exp } to req.user
    next();
  });
}

module.exports = {
  router,
  authenticateJWT,
};
