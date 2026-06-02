import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import fs from 'fs';
import { extractTextFromPDF, analyzeResume } from '../services/aiService.js';


/**
 * @desc    Apply for a job (Candidate uploads resume, triggers AI screening)
 * @route   POST /api/applications/apply
 * @access  Private (Candidate only)
 */
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const resumeFile = req.file;

  if (!jobId) {
    // Clean up uploaded file if present
    if (resumeFile) fs.unlinkSync(resumeFile.path);
    return res.status(400).json({ success: false, message: 'Please provide job ID' });
  }

  if (!resumeFile) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume file' });
  }

  try {
    // 1. Verify Job exists
    const job = await Job.findById(jobId).populate('createdBy', 'name email');
    if (!job) {
      fs.unlinkSync(resumeFile.path);
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    // 2. Check if candidate has already applied for this job
    const existingApplication = await Application.findOne({
      candidateId: req.user._id,
      jobId,
    });

    if (existingApplication) {
      fs.unlinkSync(resumeFile.path);
      return res.status(400).json({ success: false, message: 'You have already applied for this position' });
    }

    // 3. Extract text from PDF
    console.log('Extracting text from uploaded PDF:', resumeFile.path);
    const parsedResumeText = await extractTextFromPDF(resumeFile.path);
    
    if (!parsedResumeText.trim()) {
      fs.unlinkSync(resumeFile.path);
      return res.status(400).json({ success: false, message: 'The uploaded PDF is empty or could not be read.' });
    }

    // 4. Perform AI Resume Screening Comparison
    console.log('Comparing resume against Job Profile using AI engine...');
    const aiAnalysis = await analyzeResume(
      parsedResumeText,
      job.description,
      job.skillsRequired
    );

    // Save PDF locally under a persistent route or relative file URL
    // For local application, we will store the uploaded path as the resumeUrl.
    const resumeUrl = `/uploads/${resumeFile.filename}`;

    // 5. Calculate Status based on filtering logic rules:
    // Score >= 70 -> Shortlisted, 50-69 -> Review, < 50 -> Rejected
    let status = 'Review';
    if (aiAnalysis.matchScore >= 70) {
      status = 'Shortlisted';
    } else if (aiAnalysis.matchScore < 50) {
      status = 'Rejected';
    }

    // 6. Save Application in MongoDB
    const application = new Application({
      candidateId: req.user._id,
      jobId,
      resumeUrl,
      parsedResumeText,
      aiScore: aiAnalysis.matchScore,
      aiSummary: aiAnalysis.summary,
      matchedSkills: aiAnalysis.matchedSkills,
      missingSkills: aiAnalysis.missingSkills,
      strengths: aiAnalysis.strengths,
      weaknesses: aiAnalysis.weaknesses,
      recommendation: aiAnalysis.recommendation,
      status: status, // Automatically assign filtered status
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Application submitted and AI-screened successfully!',
      application,
    });

  } catch (error) {
    console.error('Apply Job Error:', error.message);
    // Cleanup physical file on crash
    if (resumeFile && fs.existsSync(resumeFile.path)) {
      try { fs.unlinkSync(resumeFile.path); } catch (e) { console.error('FS Unlink error:', e.message); }
    }
    res.status(500).json({ success: false, message: error.message || 'Server error during application' });
  }
};

/**
 * @desc    Get all applications for a job posting (HR only, sorted by AI score desc)
 * @route   GET /api/applications/job/:jobId
 * @access  Private (HR only)
 */
export const getApplicationsForJob = async (req, res) => {
  const { jobId } = req.params;

  try {
    // 1. Verify Job and ownership
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants for this job' });
    }

    // 2. Fetch applications, sort by matchScore DESC
    const applications = await Application.find({ jobId })
      .populate('candidateId', 'name email')
      .sort({ aiScore: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Get Job Applicants Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching applicants' });
  }
};

/**
 * @desc    Get candidate's own job applications
 * @route   GET /api/applications/my-applications
 * @access  Private (Candidate only)
 */
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidateId: req.user._id })
      .populate({
        path: 'jobId',
        select: 'title company salary location description',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    console.error('Get My Applications Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching your applications' });
  }
};

/**
 * @desc    Update Application status (HR manually updates shortlist/reject)
 * @route   PUT /api/applications/:id/status
 * @access  Private (HR only)
 */
export const updateApplicationStatus = async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;

  if (!status || !['Applied', 'Shortlisted', 'Rejected', 'Review'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid application status' });
  }

  try {
    const application = await Application.findById(id).populate('jobId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Verify requesting HR is the creator of the associated Job
    if (application.jobId.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this candidate status' });
    }

    application.status = status;
    await application.save();

    res.status(200).json({
      success: true,
      message: `Candidate application marked as ${status} successfully.`,
      application,
    });
  } catch (error) {
    console.error('Update Application Status Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while updating status' });
  }
};

/**
 * @desc    Directly upload & screen a candidate's resume (HR only)
 * @route   POST /api/applications/screen-direct
 * @access  Private (HR only)
 */
export const screenResumeDirectly = async (req, res) => {
  const { jobId, candidateName, candidateEmail } = req.body;
  const resumeFile = req.file;

  if (!jobId) {
    if (resumeFile) fs.unlinkSync(resumeFile.path);
    return res.status(400).json({ success: false, message: 'Please provide job ID' });
  }

  if (!candidateName || !candidateEmail) {
    if (resumeFile) fs.unlinkSync(resumeFile.path);
    return res.status(400).json({ success: false, message: 'Please provide candidate name and email' });
  }

  if (!resumeFile) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume file' });
  }

  try {
    // 1. Verify Job exists and is owned by this HR
    const job = await Job.findById(jobId);
    if (!job) {
      fs.unlinkSync(resumeFile.path);
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }

    if (job.createdBy.toString() !== req.user._id.toString()) {
      fs.unlinkSync(resumeFile.path);
      return res.status(403).json({ success: false, message: 'Not authorized to screen resumes for this job' });
    }

    // 2. Find or create the candidate user
    let candidate = await User.findOne({ email: candidateEmail.toLowerCase().trim() });
    if (!candidate) {
      candidate = new User({
        name: candidateName.trim(),
        email: candidateEmail.toLowerCase().trim(),
        password: Math.random().toString(36).slice(-8), // random temp password
        role: 'candidate',
        isVerified: true, // Auto-verified since created by HR
      });
      await candidate.save();
    }

    // 3. Check if this candidate already has an application for this job
    const existingApplication = await Application.findOne({
      candidateId: candidate._id,
      jobId,
    });

    if (existingApplication) {
      fs.unlinkSync(resumeFile.path);
      return res.status(400).json({ success: false, message: 'This candidate has already been screened for this position' });
    }

    // 4. Extract text from PDF
    console.log('Extracting text from uploaded PDF for direct screening:', resumeFile.path);
    const parsedResumeText = await extractTextFromPDF(resumeFile.path);
    
    if (!parsedResumeText.trim()) {
      fs.unlinkSync(resumeFile.path);
      return res.status(400).json({ success: false, message: 'The uploaded PDF is empty or could not be read.' });
    }

    // 5. Perform AI Resume Screening Comparison
    console.log('Comparing resume against Job Profile using AI engine...');
    const aiAnalysis = await analyzeResume(
      parsedResumeText,
      job.description,
      job.skillsRequired
    );

    const resumeUrl = `/uploads/${resumeFile.filename}`;

    // 6. Calculate Status based on filtering logic rules
    let status = 'Review';
    if (aiAnalysis.matchScore >= 70) {
      status = 'Shortlisted';
    } else if (aiAnalysis.matchScore < 50) {
      status = 'Rejected';
    }

    // 7. Save Application
    const application = new Application({
      candidateId: candidate._id,
      jobId,
      resumeUrl,
      parsedResumeText,
      aiScore: aiAnalysis.matchScore,
      aiSummary: aiAnalysis.summary,
      matchedSkills: aiAnalysis.matchedSkills,
      missingSkills: aiAnalysis.missingSkills,
      strengths: aiAnalysis.strengths,
      weaknesses: aiAnalysis.weaknesses,
      recommendation: aiAnalysis.recommendation,
      status: status,
    });

    await application.save();

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and screened successfully by AI!',
      application: {
        ...application.toObject(),
        candidateId: {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
        }
      },
    });

  } catch (error) {
    console.error('Direct Screen Resume Error:', error.message);
    if (resumeFile && fs.existsSync(resumeFile.path)) {
      try { fs.unlinkSync(resumeFile.path); } catch (e) {}
    }
    res.status(500).json({ success: false, message: error.message || 'Server error during direct screening' });
  }
};
