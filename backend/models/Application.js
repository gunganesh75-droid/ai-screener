import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: [true, 'Please provide resume URL'],
    },
    parsedResumeText: {
      type: String,
      required: [true, 'Please provide parsed resume text'],
    },
    aiScore: {
      type: Number,
      default: 0,
    },
    aiSummary: {
      type: String,
      default: '',
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    recommendation: {
      type: String,
      enum: ['Shortlist', 'Reject', 'Review'],
      default: 'Review',
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Rejected', 'Review'],
      default: 'Applied',
    },
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model('Application', applicationSchema);
export default Application;
