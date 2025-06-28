// backend/server.js

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');
const fs         = require('fs');

const { router: authRouter } = require('./auth');
const apiRouter              = require('./routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── GLOBAL MIDDLEWARE ─────────────────────────────────────────

// Read your front-end’s URL from ENV (fallback for local dev)
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

app.use(bodyParser.json());

// ─── SERVE UPLOADED FILES ───────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── ROUTES ────────────────────────────────────────────────────
// Auth routes:      /api/auth/…
app.use('/api/auth', authRouter);
// Lecturer + student: /api/…
app.use('/api', apiRouter);

// ─── SERVE React BUILD IN PRODUCTION ────────────────────────────
if (process.env.NODE_ENV === 'production') {
  // 1) Serve static files from the React app
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // 2) All other GET requests not handled before will return React's index.html
  app.get('*', (req, res) => {
    res.sendFile(
      path.join(__dirname, '../frontend/build', 'index.html')
    );
  });
}


// ─── HEALTH‐CHECK ───────────────────────────────────────────────
app.get('/', (req, res) => res.send('Backend is working'));

// ─── ERROR HANDLER ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('💥 Uncaught error:', err);
  res.status(500).json({ message: err.message });
});

// ─── START SERVER ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
