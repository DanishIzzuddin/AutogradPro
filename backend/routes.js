// backend/routes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const db = require('./db');
const bcrypt = require('bcrypt');
const { gradeZip } = require('./services/graderService');

const router = express.Router();

// ─── JWT AUTH MIDDLEWARE ──────────────────────────────────────────
function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).end();
  const token = header.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).end();
    req.user = payload;  // payload.sub is user ID, payload.role is user role
    next();
  });
}

// ─── MULTER & UPLOADS FOLDER ────────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const upload = multer({ dest: UPLOADS_DIR });

// ─── LECTURER ROUTES ──────────────────────────────────────────────

// ─── LECTURER ROUTES ──────────────────────────────────────────────

// List subjects
router.get('/lecturer/subjects', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'lecturer') return res.status(403).end();
  try {
    const [subs] = await db.query(
      `SELECT s.id, s.code, s.name
         FROM subjects s
         JOIN teacher_subjects ts ON ts.subject_id = s.id
        WHERE ts.teacher_id = ?`,
      [req.user.sub]
    );
    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// List assignments under a subject
router.get('/lecturer/subjects/:sid/assignments', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'lecturer') return res.status(403).end();
  try {
    const subjectId = +req.params.sid;
    const [asgn] = await db.query(
      `SELECT 
         id, 
         title, 
         description, 
         due_date, 
         assignment_type, 
         pka_file, 
         master_zip, 
         master_neigh_zip
       FROM assignments
      WHERE subject_id = ?`,
      [subjectId]
    );
    res.json(asgn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Create a new assignment
const cpUpload = upload.fields([
  { name: 'pka_file', maxCount: 1 },
  { name: 'master_zip', maxCount: 1 },
  { name: 'master_neigh_zip', maxCount: 1 }
]);
router.post('/lecturer/subjects/:sid/assignments', authenticateJWT, cpUpload, async (req, res) => {
  if (req.user.role !== 'lecturer') return res.status(403).end();
  try {
    const subjectId = +req.params.sid;
    const { title, description, due_date, assignment_type } = req.body;

    // Validate due_date
    if (!due_date || isNaN(Date.parse(due_date))) {
      return res.status(400).json({ message: 'A valid due_date (ISO string) is required' });
    }
    if (new Date(due_date) <= new Date()) {
      return res.status(400).json({ message: 'due_date must be in the future' });
    }

    const pkaFile = req.files['pka_file']?.[0]?.filename || '';
    const masterZip = req.files['master_zip']?.[0]?.filename || '';
    const masterNeigh = req.files['master_neigh_zip']?.[0]?.filename || '';

    await db.query(
      `INSERT INTO assignments
         (subject_id, title, description, due_date,
          assignment_type, pka_file,
          master_zip, master_neigh_zip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subjectId,
        title,
        description,
        due_date,         // snake_case column
        assignment_type,
        pkaFile,
        masterZip,
        masterNeigh
      ]
    );

    res.status(201).json({ message: 'Assignment created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get performance stats for one assignment
router.get('/lecturer/assignment-performance/:assignmentId', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'lecturer') return res.status(403).end();
  const assignmentId = +req.params.assignmentId;
  try {
    // overall stats
    const [stats] = await db.query(
      `SELECT COUNT(*) AS total_submissions,
              AVG(score) AS average_score
         FROM submissions
        WHERE assignment_id = ? AND score IS NOT NULL`,
      [assignmentId]
    );
    // top 3 scorers
    const [top] = await db.query(
      `SELECT u.name AS student_name, s.score
         FROM submissions s
         JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ? AND s.score IS NOT NULL
        ORDER BY s.score DESC LIMIT 3`,
      [assignmentId]
    );
    // bottom 3 scorers
    const [bottom] = await db.query(
      `SELECT u.name AS student_name, s.score
         FROM submissions s
         JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ? AND s.score IS NOT NULL
        ORDER BY s.score ASC LIMIT 3`,
      [assignmentId]
    );
    // full list for chart
    const [allRows] = await db.query(
      `SELECT u.name AS student_name, s.score
         FROM submissions s
         JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ? AND s.score IS NOT NULL`,
      [assignmentId]
    );

    res.json({
      stats: stats[0],
      top,
      bottom,
      allStudents: allRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// List all submissions for a given assignment
router.get(
  '/lecturer/assignments/:aid/submissions',
  authenticateJWT,
  async (req, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).end();
    const assignmentId = +req.params.aid;
    try {
      const [rows] = await db.query(
        `SELECT
           s.id             AS submission_id,
           s.student_id,
           u.name           AS student_name,
           s.config_zip     AS zip_file,
           s.neighbor_zip   AS neighbor_zip,
           s.pka_file       AS pka_file,
           s.score          AS total_score
         FROM submissions s
         JOIN users u ON u.id = s.student_id
         WHERE s.assignment_id = ?`,
        [assignmentId]
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Get detailed results for one submission
router.get(
  '/lecturer/submissions/:submissionId/details',
  authenticateJWT,
  async (req, res) => {
    if (req.user.role !== 'lecturer') return res.status(403).end();
    const submissionId = +req.params.submissionId;
    try {
      // 1) per-router breakdown
      const [perRouter] = await db.query(
        `SELECT router_name, score, feedback
           FROM router_results
          WHERE submission_id = ?`,
        [submissionId]
      );
      const per_router = {};
      for (let r of perRouter) {
        per_router[r.router_name] = {
          score: r.score,
          feedback: r.feedback.split('\n')
        };
      }

      // 2) core submission record
      const [[sub]] = await db.query(
        `SELECT config_zip, neighbor_zip, pka_file, score
           FROM submissions
          WHERE id = ?`,
        [submissionId]
      );

      const zipFileUrl = `/uploads/${sub.config_zip}`;
      const neighborUrl = sub.neighbor_zip ? `/uploads/${sub.neighbor_zip}` : null;
      const pkaFileUrl = sub.pka_file ? `/uploads/${sub.pka_file}` : null;


      // 3) fetch subject & assignment via the submission row
      const [[assignmentRow]] = await db.query(
        `SELECT subj.name  AS subject_name,
                a.title    AS assignment_title
           FROM submissions sub
           JOIN assignments a ON sub.assignment_id = a.id
           JOIN subjects   subj ON a.subject_id    = subj.id
          WHERE sub.id = ?`,
        [submissionId]
      );

      // 4) build the PDF report
      const pdfName = `report_${submissionId}.pdf`;
      const pdfPath = path.join(UPLOADS_DIR, pdfName);
      await new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        // clean up any existing file
        if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // ── Report header ──
        doc.fontSize(18).text('Automated Grading Report', { align: 'center' }).moveDown(0.5);

        // ── Student info ──
        const [[stud]] = await db.query(
          `SELECT u.name, u.email
             FROM users u
             JOIN submissions s ON s.student_id = u.id
            WHERE s.id = ?`,
          [submissionId]
        );
        doc
          .fontSize(10)
          .text(`Student Name : ${stud.name}`)
          .text(`Student Email: ${stud.email}`)
          .moveDown();

        // ── Assignment & score ──
        doc
          .fontSize(12)
          .text(`Subject   : ${assignmentRow.subject_name}`)
          .text(`Assignment: ${assignmentRow.assignment_title}`)
          .text(`Student ID: ${sub.student_id}`)
          .text(`Score     : ${sub.score}`)
          .moveDown();

        // ── Per‐router feedback ──
        for (const [rtr, info] of Object.entries(per_router)) {
          doc.fontSize(14).text(`Router: ${rtr}`, { underline: true });
          doc.fontSize(12).text(`Score: ${info.score}`, { indent: 20 }).moveDown(0.3);
          info.feedback.forEach(line =>
            doc.text(`• ${line}`, { indent: 40 })
          );
          doc.moveDown();
        }

        // ──　(Topology section removed) ──
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // 5) save PDF filename back on the submission row
      await db.query(
        `UPDATE submissions
            SET report_file = ?
          WHERE id = ?`,
        [pdfName, submissionId]
      );

      const feedbackPdfUrl = `/uploads/${pdfName}`;

      res.json({
        per_router,
        total_score: sub.score,
        zipFileUrl,
        neighborUrl,
        pkaFileUrl,
        feedbackPdfUrl
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  }
);

router.put(
  '/lecturer/submissions/:submissionId/score',
  authenticateJWT,
  async (req, res) => {
    if (req.user.role !== 'lecturer') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const submissionId = +req.params.submissionId;
    const { newScore, password } = req.body;
    if (newScore == null || !password) {
      return res
        .status(400)
        .json({ message: 'newScore and password are required' });
    }

    try {
      // 1) Verify lecturer’s password
      const [[lect]] = await db.query(
        'SELECT password FROM users WHERE id = ?',
        [req.user.sub]
      );
      if (!lect) {
        return res.status(404).json({ message: 'Lecturer not found' });
      }
      const ok = await bcrypt.compare(password, lect.password);
      if (!ok) {
        return res.status(401).json({ message: 'Invalid password' });
      }

      // 2) Update the submission’s score
      await db.query(
        'UPDATE submissions SET score = ? WHERE id = ?',
        [newScore, submissionId]
      );

      return res.json({ submissionId, newScore });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: err.message });
    }
  }
);

// ─── STUDENT ROUTES ────────────────────────────────────────────────

// List the student’s enrolled subjects
router.get('/student/subjects', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).end();
  try {
    const studentId = req.user.sub;
    const [subs] = await db.query(
      `SELECT s.id, s.code, s.name
         FROM subjects s
         JOIN student_subjects ss ON ss.subject_id = s.id
        WHERE ss.student_id = ?`,
      [studentId]
    );
    res.json(subs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// List assignments under one subject
router.get('/student/subjects/:sid/assignments', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).end();
  try {
    const subjectId = +req.params.sid;
    const [rows] = await db.query(
      `SELECT id, title, description, due_date,
              assignment_type, pka_file
         FROM assignments
        WHERE subject_id = ?`,
      [subjectId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch a single assignment’s type
router.get('/student/assignment/:aid', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).end();
  try {
    const aid = +req.params.aid;
    const [rows] = await db.query(
      `SELECT assignment_type
         FROM assignments
        WHERE id = ?`,
      [aid]
    );
    if (!rows.length) return res.status(404).end();
    res.json({ assignment_type: rows[0].assignment_type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Fetch an existing submission (if any)
router.get('/student/submission/:aid', authenticateJWT, async (req, res) => {
  if (req.user.role !== 'student') return res.status(403).end();
  const assignmentId = +req.params.aid;
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         submitted_at,
         score,
         feedback,
         config_zip,
         neighbor_zip,
         pka_file,
         report_file,
         CONCAT('/uploads/', report_file) AS feedbackPdfUrl
       FROM submissions
      WHERE student_id = ? AND assignment_id = ?`,
      [req.user.sub, assignmentId]
    );
    if (!rows.length) return res.status(404).end();
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Get this student’s percentile & class distribution
router.get(
  '/student/assignment/:aid/performance',
  authenticateJWT,
  async (req, res, next) => {
    if (req.user.role !== 'student') return res.status(403).end();
    const assignmentId = +req.params.aid;
    try {
      const [allRows] = await db.query(
        `SELECT score
           FROM submissions
          WHERE assignment_id = ? AND score IS NOT NULL`,
        [assignmentId]
      );
      const scores = allRows.map(r => Number(r.score)).sort((a, b) => a - b);

      const [meRows] = await db.query(
        `SELECT score
           FROM submissions
          WHERE assignment_id = ? AND student_id = ?`,
        [assignmentId, req.user.sub]
      );
      if (!meRows.length) {
        return res.status(404).json({ message: 'Not submitted yet' });
      }
      const myScore = Number(meRows[0].score);

      const rank = scores.findIndex(s => s >= myScore) + 1;
      const percentile = Math.round((rank / scores.length) * 100);
      const sum = scores.reduce((sum, s) => sum + s, 0);
      const average = Math.round((sum / scores.length) * 100) / 100;

      res.json({ myScore, scores, percentile, average });
    } catch (err) {
      next(err);
    }
  }
);

// Upload & grade the student’s config ZIP
router.post(
  '/student/upload-config',
  authenticateJWT,
  upload.fields([
    { name: 'config_zip', maxCount: 1 },
    { name: 'neighbor_zip', maxCount: 1 },
    { name: 'pka_file', maxCount: 1 }
  ]),
  async (req, res, next) => {
    if (req.user.role !== 'student') return res.status(403).end();

    try {
      const { assignmentId, birthdayPrefix } = req.body;
      const cfgFile = req.files['config_zip']?.[0];
      if (!cfgFile) {
        return res.status(400).json({ message: 'config_zip is required' });
      }

      // Paths & filenames for student files
      const cfgName = cfgFile.filename;
      const studentZipPath = cfgFile.path;
      const neighborZipFile = req.files['neighbor_zip']?.[0];
      const neighName = neighborZipFile ? neighborZipFile.filename : null;
      const studentNeighPath = neighborZipFile?.path || studentZipPath;
      const pkaFileEntry = req.files['pka_file']?.[0];
      const pkaName = pkaFileEntry ? pkaFileEntry.filename : null;

      // Fetch master ZIP filenames for this assignment
      const [aRows] = await db.query(
        `SELECT master_zip, master_neigh_zip
           FROM assignments
          WHERE id = ?`,
        [assignmentId]
      );
      if (!aRows.length) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      // Build full paths for lecturer’s reference zips
      const masterZipPath = path.join(UPLOADS_DIR, aRows[0].master_zip);
      const masterNeighZipPath = aRows[0].master_neigh_zip
        ? path.join(UPLOADS_DIR, aRows[0].master_neigh_zip)
        : masterZipPath;

      // Call the Python grader
      const summary = await gradeZip(
        masterZipPath,
        studentZipPath,
        masterNeighZipPath,
        studentNeighPath,
        birthdayPrefix
      );

      // Persist submission record (insert or update)
      const [insertResult] = await db.query(
        `INSERT INTO submissions
           (student_id, assignment_id, submitted_at, score, feedback,
            config_zip, neighbor_zip, pka_file)
         VALUES (?, ?, NOW(), ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           score        = VALUES(score),
           feedback     = VALUES(feedback),
           submitted_at = NOW(),
           config_zip   = VALUES(config_zip),
           neighbor_zip = VALUES(neighbor_zip),
           pka_file     = VALUES(pka_file)`,
        [
          req.user.sub,
          assignmentId,
          summary.final_score,
          JSON.stringify(summary.per_router),
          cfgName,
          neighName,
          pkaName
        ]
      );
      let submissionId = insertResult.insertId;
      if (!submissionId) {
        const [rows] = await db.query(
          `SELECT id
             FROM submissions
            WHERE student_id = ? AND assignment_id = ?`,
          [req.user.sub, assignmentId]
        );
        submissionId = rows[0].id;
      }

      // Persist per-router results
      await Promise.all(
        Object.entries(summary.per_router).map(([routerName, data]) =>
          db.query(
            `INSERT INTO router_results
             (submission_id, router_name, score, feedback, diff)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             score    = VALUES(score),
             feedback = VALUES(feedback)`,
            [
              submissionId,
              routerName,
              data.score,
              data.feedback.join('\n'),
              ''
            ]
          )
        )
      );

      // ─── Generate PDF feedback for student immediately ───
      // (One clean PDFDocument block, exactly as before)
      const [[assignmentRowStudent]] = await db.query(
        `SELECT subj.name  AS subject_name,
              a.title    AS assignment_title
         FROM assignments a
         JOIN subjects   subj ON a.subject_id = subj.id
        WHERE a.id = ?`,
        [assignmentId]
      );

      const pdfName = `report_${submissionId}.pdf`;
      const pdfPath = path.join(UPLOADS_DIR, pdfName);

      await new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40 });
        const stream = fs.createWriteStream(pdfPath);
        doc.pipe(stream);

        // report header
        doc
          .fontSize(18)
          .text('Automated Grading Report', { align: 'center' })
          .moveDown(0.5);

        // core info
        doc
          .fontSize(12)
          .text(`Subject   : ${assignmentRowStudent.subject_name}`)
          .text(`Assignment: ${assignmentRowStudent.assignment_title}`)
          .text(`Student ID: ${req.user.sub}`)
          .text(`Score     : ${summary.final_score}`)
          .moveDown();

        // per-router breakdown
        for (const [rtr, info] of Object.entries(summary.per_router)) {
          doc.fontSize(14).text(`Router: ${rtr}`, { underline: true });
          doc.fontSize(12).text(`Score: ${info.score}`, { indent: 20 });
          doc.moveDown(0.3);
          info.feedback.forEach(line =>
            doc.text(`• ${line}`, { indent: 40 })
          );
          doc.moveDown();
        }

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      //  Save the generated PDF filename on the submission row
      await db.query(
        `UPDATE submissions
          SET report_file = ?
        WHERE id = ?`,
        [pdfName, submissionId]
      );

      //  Finally return the URL for the client to download
      return res.json({
        success: true,
        summary,
        feedbackPdfUrl: `/uploads/${pdfName}`
      });

    } catch (err) {
      console.error(err);
      next(err);
    }
  });

// ─── CURRENT USER PROFILE ──────────────────────────────────────────
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const [[user]] = await db.query(
      `SELECT id, name, email, age, role
         FROM users
        WHERE id = ?`,
      [req.user.sub]
    );
    if (!user) return res.status(404).end();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ─── UPDATE PROFILE ────────────────────────────────────────────────
router.put('/me', authenticateJWT, async (req, res) => {
  const { name, email, age } = req.body;
  try {
    await db.query(
      `UPDATE users
          SET name  = ?,
              email = ?,
              age   = ?
        WHERE id = ?`,
      [name, email, age || null, req.user.sub]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ─── CHANGE PASSWORD ───────────────────────────────────────────────
router.put('/me/password', authenticateJWT, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // enforce strong password rule
  const strongRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!strongRegex.test(newPassword)) {
    return res.status(400).json({
      message:
        'New password must be at least 8 characters, include one uppercase letter and one number.'
    });
  }

  try {
    // 1) fetch existing hash from `password`
    const [[row]] = await db.query(
      `SELECT password FROM users WHERE id = ?`,
      [req.user.sub]
    );

    // 2) compare
    const match = await bcrypt.compare(oldPassword, row.password);
    if (!match) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    // 3) hash & update back into `password`
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query(
      `UPDATE users
          SET password = ?
        WHERE id = ?`,
      [newHash, req.user.sub]
    );

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
