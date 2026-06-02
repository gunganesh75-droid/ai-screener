import express from 'express';
import {
  applyForJob,
  getApplicationsForJob,
  getMyApplications,
  updateApplicationStatus,
  screenResumeDirectly,
} from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Candidate: apply for a job (with PDF resume upload)
router.post('/apply', protect, authorize('candidate'), upload.single('resume'), applyForJob);

// Candidate: view own applications
router.get('/my-applications', protect, authorize('candidate'), getMyApplications);

// HR: view all applicants for a job
router.get('/job/:jobId', protect, authorize('hr'), getApplicationsForJob);

// HR: update applicant status (shortlist / reject)
router.put('/:id/status', protect, authorize('hr'), updateApplicationStatus);

// HR: directly upload and screen a candidate resume
router.post('/screen-direct', protect, authorize('hr'), upload.single('resume'), screenResumeDirectly);

export default router;
