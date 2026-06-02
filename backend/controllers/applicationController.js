import { db } from '../config/firebase.js';
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
    if (resumeFile) fs.unlinkSync(resumeFile.path);
    return res.status(400).json({ success: false, message: 'Please provide job ID' });
  }

  if (!resumeFile) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF resume file' });
  }

  try {
    const userId = req.user.id || req.user.uid;

    // 1. Verify Job exists
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      fs.unlinkSync(resumeFile.path);
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }
    const job = jobDoc.data();

    // 2. Check if candidate has already applied for this job
    const existingApps = await db.collection('applications')
      .where('candidateId', '==', userId)
      .where('jobId', '==', jobId)
      .get();

    if (!existingApps.empty) {
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

    const resumeUrl = `/uploads/${resumeFile.filename}`;

    // 5. Calculate Status based on filtering logic rules:
    // Score >= 70 -> Shortlisted, 50-69 -> Review, < 50 -> Rejected
    let status = 'Review';
    if (aiAnalysis.matchScore >= 70) {
      status = 'Shortlisted';
    } else if (aiAnalysis.matchScore < 50) {
      status = 'Rejected';
    }

    // 6. Save Application in Firestore
    const appRef = db.collection('applications').doc();
    const applicationData = {
      id: appRef.id,
      candidateId: userId,
      candidateName: req.user.name || '',
      candidateEmail: req.user.email || '',
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
      createdAt: new Date().toISOString()
    };

    await appRef.set(applicationData);

    res.status(201).json({
      success: true,
      message: 'Application submitted and AI-screened successfully!',
      application: {
        _id: appRef.id,
        ...applicationData
      },
    });

  } catch (error) {
    console.error('Apply Job Error:', error.message);
    if (resumeFile && fs.existsSync(resumeFile.path)) {
      try { fs.unlinkSync(resumeFile.path); } catch (e) {}
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
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }
    const job = jobDoc.data();
    const userId = req.user.id || req.user.uid;

    if (job.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view applicants for this job' });
    }

    // 2. Fetch applications, sort by matchScore DESC
    const appsSnapshot = await db.collection('applications')
      .where('jobId', '==', jobId)
      .get();

    let applications = [];
    appsSnapshot.forEach((doc) => {
      const data = doc.data();
      applications.push({
        _id: doc.id,
        id: doc.id,
        ...data,
        candidateId: {
          _id: data.candidateId,
          name: data.candidateName || 'Candidate',
          email: data.candidateEmail || ''
        }
      });
    });

    // Sort by AI Score DESC
    applications.sort((a, b) => b.aiScore - a.aiScore);

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
    const userId = req.user.id || req.user.uid;

    const appsSnapshot = await db.collection('applications')
      .where('candidateId', '==', userId)
      .get();

    const applications = [];

    // Gather application data
    const appPromises = appsSnapshot.docs.map(async (doc) => {
      const appData = doc.data();
      
      // Populate job details
      let jobDetails = { title: 'Unknown Position', company: 'Unknown Company', salary: '', location: '' };
      try {
        const jobDoc = await db.collection('jobs').doc(appData.jobId).get();
        if (jobDoc.exists) {
          const jd = jobDoc.data();
          jobDetails = {
            title: jd.title,
            company: jd.company,
            salary: jd.salary,
            location: jd.location,
            description: jd.description
          };
        }
      } catch (err) {
        console.error(`Failed to load job details for application ${doc.id}:`, err.message);
      }

      return {
        _id: doc.id,
        id: doc.id,
        ...appData,
        jobId: {
          _id: appData.jobId,
          ...jobDetails
        }
      };
    });

    const populatedApps = await Promise.all(appPromises);

    // Sort by newest application first
    populatedApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: populatedApps.length,
      applications: populatedApps,
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
    const appRef = db.collection('applications').doc(id);
    const appDoc = await appRef.get();

    if (!appDoc.exists) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = appDoc.data();

    // Verify requesting HR is the creator of the associated Job
    const jobDoc = await db.collection('jobs').doc(application.jobId).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Associated job posting not found' });
    }
    
    const job = jobDoc.data();
    const userId = req.user.id || req.user.uid;

    if (job.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this candidate status' });
    }

    await appRef.update({ status });

    res.status(200).json({
      success: true,
      message: `Candidate application marked as ${status} successfully.`,
      application: {
        _id: id,
        ...application,
        status
      },
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
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      fs.unlinkSync(resumeFile.path);
      return res.status(404).json({ success: false, message: 'Job opening not found' });
    }
    
    const job = jobDoc.data();
    const userId = req.user.id || req.user.uid;

    if (job.createdBy !== userId) {
      fs.unlinkSync(resumeFile.path);
      return res.status(403).json({ success: false, message: 'Not authorized to screen resumes for this job' });
    }

    // 2. Find or create the candidate user in Firestore
    const candidateQuery = await db.collection('users')
      .where('email', '==', candidateEmail.toLowerCase().trim())
      .get();
    
    let candidateId;
    let candidateNameVal = candidateName.trim();

    if (candidateQuery.empty) {
      const newCandRef = db.collection('users').doc();
      candidateId = newCandRef.id;
      await newCandRef.set({
        id: candidateId,
        name: candidateNameVal,
        email: candidateEmail.toLowerCase().trim(),
        role: 'candidate',
        isVerified: true,
        createdAt: new Date().toISOString()
      });
    } else {
      const existingCand = candidateQuery.docs[0];
      candidateId = existingCand.id;
      candidateNameVal = existingCand.data().name;
    }

    // 3. Check if this candidate already has an application for this job
    const existingApps = await db.collection('applications')
      .where('candidateId', '==', candidateId)
      .where('jobId', '==', jobId)
      .get();

    if (!existingApps.empty) {
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

    // 7. Save Application in Firestore
    const appRef = db.collection('applications').doc();
    const appData = {
      id: appRef.id,
      candidateId: candidateId,
      candidateName: candidateNameVal,
      candidateEmail: candidateEmail.toLowerCase().trim(),
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
      createdAt: new Date().toISOString()
    };

    await appRef.set(appData);

    res.status(201).json({
      success: true,
      message: 'Resume uploaded and screened successfully by AI!',
      application: {
        _id: appRef.id,
        ...appData,
        candidateId: {
          _id: candidateId,
          name: candidateNameVal,
          email: candidateEmail.toLowerCase().trim(),
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
