import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// ── Common disposable / throwaway email domains ─────────────────────────────
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'yopmail.com', '10minutemail.com', 'tempmail.com', 'temp-mail.org',
  'dispostable.com', 'guerrillamail.com', 'sharklasers.com', 'getairmail.com',
  'burnermail.io', 'trashmail.com', 'maildrop.cc', 'tempmailaddress.com',
  'generator.email', 'discard.email', 'throwawaymail.com', 'temp-mail.ru',
  'temp-mail.com', 'crazymailing.com', 'fakeinbox.com', 'mailnesia.com',
  'mailcatch.com', 'tempr.email', 'tempmail.net', 'throwam.com',
  'spamgourmet.com', 'spamgourmet.net', 'trashmail.net', 'fakemailgenerator.com',
]);

// ── Email format validation ──────────────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return { valid: false, message: 'Email is required' };
  const sanitized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(sanitized)) return { valid: false, message: 'Please enter a valid email address' };
  const domain = sanitized.split('@')[1];
  if (DISPOSABLE_DOMAINS.has(domain)) return { valid: false, message: 'Disposable or temporary email addresses are not allowed. Please use a real email.' };
  return { valid: true, email: sanitized };
};

// ── JWT helper ───────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey123456!@#', { expiresIn: '30d' });

// ── Register ─────────────────────────────────────────────────────────────────
/**
 * @desc    Register a new user (Candidate or HR)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Field presence check ────────────────────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }
    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }
    if (password.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }
    if (!role || !['candidate', 'hr'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be candidate or hr' });
    }

    // ── Email validation ────────────────────────────────────────────────────
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      return res.status(400).json({ success: false, message: emailCheck.message });
    }
    const sanitizedEmail = emailCheck.email;

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existing = await User.findOne({ email: sanitizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists. Please sign in instead.' });
    }

    // ── Create user ─────────────────────────────────────────────────────────
    const user = new User({
      name: name.trim(),
      email: sanitizedEmail,
      password,
      role,
      isVerified: true,
    });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter your email and password' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Ensure user is marked as verified
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
};

// ── Google Sign-In / Sign-Up ──────────────────────────────────────────────────
/**
 * @desc    Google OAuth sign-in or sign-up
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  try {
    const { credential, role, email: mockEmail, name: mockName } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required' });
    }

    let email, name;

    if (credential.startsWith('mock_google_')) {
      // Simulated Google login (dev / demo mode)
      email = mockEmail || 'candidate@gmail.com';
      name = mockName || 'Google User';
    } else {
      // Decode real Google ID token
      try {
        const parts = credential.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT format');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        email = payload.email;
        name = payload.name;
      } catch (err) {
        console.error('Google token decode error:', err.message);
        return res.status(400).json({ success: false, message: 'Invalid Google credential token' });
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not extract email from Google account' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    let user = await User.findOne({ email: sanitizedEmail });
    let isNewUser = false;

    if (!user) {
      // If user does not exist and no role is selected yet, signal the frontend to ask for role
      if (!role) {
        return res.status(200).json({
          success: true,
          needsRole: true,
          email: sanitizedEmail,
          name: name || 'Google User',
        });
      }
      isNewUser = true;
      const randomPassword = Math.random().toString(36).slice(-10) + 'Aa1!';
      user = new User({
        name: name || 'Google User',
        email: sanitizedEmail,
        password: randomPassword,
        role: role,
        isVerified: true,
      });
      await user.save();
    } else if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: true },
      isNewUser,
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during Google authentication' });
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────────
/**
 * @desc    Verify email exists before allowing password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    res.status(200).json({
      success: true,
      message: 'Email verified. Please set your new password.',
      email: sanitizedEmail,
    });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
/**
 * @desc    Reset user password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }
    if (newPassword.trim().length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: sanitizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password reset successfully! You can now sign in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};
