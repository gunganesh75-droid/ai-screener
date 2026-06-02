import { db } from '../config/firebase.js';

/**
 * @desc    Create a new job posting
 * @route   POST /api/jobs
 * @access  Private (HR only)
 */
export const createJob = async (req, res) => {
  const { title, company, description, skillsRequired, salary, location } = req.body;

  try {
    if (!title || !company || !description || !skillsRequired || !salary || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const skillsArray = Array.isArray(skillsRequired)
      ? skillsRequired
      : skillsRequired.split(',').map((s) => s.trim());

    // Create job ref with auto-generated ID
    const jobRef = db.collection('jobs').doc();
    
    const jobData = {
      id: jobRef.id,
      title: title.trim(),
      company: company.trim(),
      description: description.trim(),
      skillsRequired: skillsArray,
      salary: salary.trim(),
      location: location.trim(),
      createdBy: req.user.id || req.user.uid,
      createdByName: req.user.name || '',
      createdByEmail: req.user.email || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await jobRef.set(jobData);

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job: jobData,
    });
  } catch (error) {
    console.error('Create Job Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while creating job' });
  }
};

/**
 * @desc    Get all job postings (with search / filter capabilities)
 * @route   GET /api/jobs
 * @access  Public
 */
export const getJobs = async (req, res) => {
  const { search, location } = req.query;

  try {
    const jobsSnapshot = await db.collection('jobs').orderBy('createdAt', 'desc').get();
    let jobs = [];
    
    jobsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Populate createdBy mock object for frontend compatibility
      jobs.push({
        _id: doc.id,
        id: doc.id,
        ...data,
        createdBy: {
          _id: data.createdBy,
          name: data.createdByName || 'Recruiter',
          email: data.createdByEmail || ''
        }
      });
    });

    // In-memory filter to support full regex-like search behavior on Firestore
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          job.title.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower)
      );
    }

    if (location) {
      const locationLower = location.toLowerCase();
      jobs = jobs.filter((job) => job.location.toLowerCase().includes(locationLower));
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Get Jobs Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching jobs' });
  }
};

/**
 * @desc    Get job details by ID
 * @route   GET /api/jobs/:id
 * @access  Public
 */
export const getJobById = async (req, res) => {
  try {
    const jobDoc = await db.collection('jobs').doc(req.params.id).get();

    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const data = jobDoc.data();
    const job = {
      _id: jobDoc.id,
      id: jobDoc.id,
      ...data,
      createdBy: {
        _id: data.createdBy,
        name: data.createdByName || 'Recruiter',
        email: data.createdByEmail || ''
      }
    };

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Get Job By ID Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while fetching job details' });
  }
};

/**
 * @desc    Update a job posting
 * @route   PUT /api/jobs/:id
 * @access  Private (HR owner only)
 */
export const updateJob = async (req, res) => {
  const { title, company, description, skillsRequired, salary, location } = req.body;

  try {
    const jobRef = db.collection('jobs').doc(req.params.id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const jobData = jobDoc.data();
    const userId = req.user.id || req.user.uid;

    // Verify ownership
    if (jobData.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this job posting',
      });
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (title) updates.title = title.trim();
    if (company) updates.company = company.trim();
    if (description) updates.description = description.trim();
    if (salary) updates.salary = salary.trim();
    if (location) updates.location = location.trim();
    
    if (skillsRequired) {
      updates.skillsRequired = Array.isArray(skillsRequired)
        ? skillsRequired
        : skillsRequired.split(',').map((s) => s.trim());
    }

    await jobRef.update(updates);

    const updatedDoc = await jobRef.get();

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job: {
        _id: jobRef.id,
        id: jobRef.id,
        ...updatedDoc.data()
      },
    });
  } catch (error) {
    console.error('Update Job Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while updating job' });
  }
};

/**
 * @desc    Delete a job posting
 * @route   DELETE /api/jobs/:id
 * @access  Private (HR owner only)
 */
export const deleteJob = async (req, res) => {
  try {
    const jobRef = db.collection('jobs').doc(req.params.id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    const jobData = jobDoc.data();
    const userId = req.user.id || req.user.uid;

    // Verify ownership
    if (jobData.createdBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job posting',
      });
    }

    // Delete job document
    await jobRef.delete();
    
    // Clean up related applications in applications collection
    const appsSnapshot = await db.collection('applications').where('jobId', '==', req.params.id).get();
    const batch = db.batch();
    appsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.status(200).json({
      success: true,
      message: 'Job posting and all associated applications deleted successfully',
    });
  } catch (error) {
    console.error('Delete Job Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error while deleting job' });
  }
};
