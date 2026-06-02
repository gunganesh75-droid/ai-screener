import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── CORS (must come before Helmet so preflight works) ───────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://ai-screener-cyan.vercel.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const clientUrl = (process.env.CLIENT_URL || '').trim();

      // Explicit whitelist check
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

      // Also allow the configured CLIENT_URL from env
      if (clientUrl && origin === clientUrl) return callback(null, true);

      // Allow any Vercel preview deployment for this project
      if (origin.match(/^https:\/\/ai-screener.*\.vercel\.app$/)) return callback(null, true);

      console.warn(`CORS blocked: ${origin}`);
      return callback(new Error(`CORS: Origin ${origin} not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Serve uploaded files BEFORE Helmet so no CSP blocks PDF viewing ─────────
// Sets explicit PDF-friendly headers so the browser opens files correctly.
app.use(['/uploads', '/api/uploads'], (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow PDF rendering in browser — do NOT set X-Frame-Options or object-src
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // 'inline' = display in browser
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Explicit GET handler for uploads to protect against platform proxy oddities
app.get(['/uploads/:file(*)', '/api/uploads/:file(*)'], (req, res) => {
  try {
    const fileName = req.params.file
    if (!fileName) return res.status(400).send('Bad Request')

    const uploadsDir = path.join(__dirname, 'uploads')
    const filePath = path.join(uploadsDir, fileName)
    // Prevent path traversal
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).send('Invalid file path')
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).send('File not found')
    }

    const stat = fs.statSync(filePath)
    const fileSize = stat.size
    const range = req.headers.range

    // If Range header present, stream partial content (required by some PDF viewers)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      if (start >= fileSize || end >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`)
        return res.end()
      }

      const chunkSize = (end - start) + 1
      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`)
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Content-Length', chunkSize)
      res.setHeader('Content-Type', 'application/pdf')
      const stream = fs.createReadStream(filePath, { start, end })
      stream.on('open', () => stream.pipe(res))
      stream.on('error', (streamErr) => {
        console.error('File stream error:', streamErr)
        if (!res.headersSent) res.status(500).end('Server error')
      })
      return
    }

    // No range — send whole file
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Length', fileSize)
    res.setHeader('Accept-Ranges', 'bytes')
    const fileStream = fs.createReadStream(filePath)
    fileStream.on('open', () => fileStream.pipe(res))
    fileStream.on('error', (streamErr) => {
      console.error('File stream error:', streamErr)
      if (!res.headersSent) res.status(500).end('Server error')
    })
  } catch (err) {
    console.error('Uploads GET handler error:', err)
    return res.status(500).send('Server error')
  }
})

// ─── Security Middleware (applied AFTER /uploads to avoid blocking PDFs) ─────
app.use(
  helmet({
    crossOriginResourcePolicy: false,       // handled manually above for /uploads
    contentSecurityPolicy: false,           // disabled — frontend handles its own CSP
  })
);

// ─── Body Parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Apply global rate limiter ───────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Resume Screening API is up and running!',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack || err.message);

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File size exceeds the 5MB limit' });
  }
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
