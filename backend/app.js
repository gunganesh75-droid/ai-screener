import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // Allow PDF rendering in browser — do NOT set X-Frame-Options or object-src
  if (req.path.endsWith('.pdf')) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline'); // 'inline' = display in browser
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

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
