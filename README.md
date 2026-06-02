# 🤖 AI Resume Screening Platform

A production-ready, full-stack AI-powered recruitment platform built with the MERN stack and Google Gemini AI.

---

## ✨ Features

- **JWT Authentication** — Role-based access (Candidate / HR)
- **AI Resume Screening** — Google Gemini parses and matches resumes to job descriptions
- **Auto-Ranking** — Candidates sorted by AI match score (0–100%)
- **Auto-Filtering** — Score ≥70% → Shortlisted · 50–69% → Review · <50% → Rejected
- **PDF Upload** — Multer resume extraction and parsing
- **Dark UI** — Modern Tailwind CSS design with animations

---

## 🗂 Project Structure

```
Resume_SCreening/
├── backend/          # Node.js + Express + MongoDB API
└── frontend/         # React + Vite + Tailwind CSS
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or MongoDB Atlas)
- Google Gemini API key ([get it here](https://aistudio.google.com/app/apikey))

---

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/resume-screener
JWT_SECRET=supersecretjwtkey123456!@#
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔑 API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register with email & password |
| POST | `/api/auth/login` | Login with email & password |
| GET | `/api/jobs` | Get all jobs (public) |
| GET | `/api/jobs/:id` | Get job details (public) |
| POST | `/api/jobs` | Create job (HR only) |
| PUT | `/api/jobs/:id` | Update job (HR owner only) |
| DELETE | `/api/jobs/:id` | Delete job (HR owner only) |

### Applications
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/applications/apply` | Apply with resume PDF (Candidate) |
| GET | `/api/applications/my-applications` | My applications (Candidate) |
| GET | `/api/applications/job/:jobId` | Job applicants (HR) |
| PUT | `/api/applications/:id/status` | Update status (HR) |

---

## 🤖 AI Scoring Logic

The Gemini AI prompt compares the resume against the job description and returns:

```json
{
  "matchScore": 85,
  "matchedSkills": ["React", "Node.js"],
  "missingSkills": ["Docker"],
  "summary": "Strong candidate...",
  "strengths": ["5 years experience..."],
  "weaknesses": ["No DevOps exposure..."],
  "recommendation": "Shortlist"
}
```

**Automatic Filtering Rules:**
- `score >= 70` → **Shortlisted** ✅
- `score 50–69` → **Review** ⚠️
- `score < 50` → **Rejected** ❌

> If Gemini API key is not configured, a local keyword-matching fallback is used automatically.

---

## 🛡 Security

- Helmet.js HTTP headers
- CORS restricted to frontend origin
- Rate limiting on all auth endpoints
- JWT token authentication
- bcrypt password hashing
- PDF-only upload validation (max 5MB)

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT, bcryptjs |
| File Upload | Multer |
| Security | Helmet, CORS, express-rate-limit |
