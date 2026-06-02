import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from '../controllers/jobController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected HR-only routes
router.post('/', protect, authorize('hr'), createJob);
router.put('/:id', protect, authorize('hr'), updateJob);
router.delete('/:id', protect, authorize('hr'), deleteJob);

export default router;
