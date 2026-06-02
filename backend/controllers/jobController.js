import Job from '../models/Job.js';
import Application from '../models/Application.js';

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

    const job = new Job({
      title,
      company,
      description,
      skillsRequired: skillsArray,
      salary,
      location,
      createdBy: req.user._id,
    });

    await job.save();

    res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job,
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
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Sort by newest first
    const jobs = await Job.find(query).sort({ createdAt: -1 }).populate('createdBy', 'name email');

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
    const job = await Job.findById(req.params.id).populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error('Get Job By ID Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }
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
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Make sure user owns job
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this job posting',
      });
    }

    const skillsArray = Array.isArray(skillsRequired)
      ? skillsRequired
      : skillsRequired.split(',').map((s) => s.trim());

    // Update fields
    job.title = title || job.title;
    job.company = company || job.company;
    job.description = description || job.description;
    job.skillsRequired = skillsRequired ? skillsArray : job.skillsRequired;
    job.salary = salary || job.salary;
    job.location = location || job.location;

    await job.save();

    res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job,
    });
  } catch (error) {
    console.error('Update Job Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }
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
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Make sure user owns job
    if (job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job posting',
      });
    }

    // Delete job
    await Job.findByIdAndDelete(req.params.id);
    
    // Clean up related applications
    await Application.deleteMany({ jobId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Job posting and all associated applications deleted successfully',
    });
  } catch (error) {
    console.error('Delete Job Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }
    res.status(500).json({ success: false, message: 'Server error while deleting job' });
  }
};
