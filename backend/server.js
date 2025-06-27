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
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
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
