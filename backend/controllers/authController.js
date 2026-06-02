import { auth, db } from '../config/firebase.js';

// ── Google Sign-In / Sign-Up with Firebase ────────────────────────────────────
/**
 * @desc    Google auth with Firebase ID Token
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res) => {
  try {
    const { credential, role, email: mockEmail, name: mockName } = req.body;

    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    let uid, email, name;

    if (credential.startsWith('mock_google_')) {
      // Simulated Google login for dev / fallback mode
      email = mockEmail || 'candidate@gmail.com';
      name = mockName || 'Google User';
      uid = 'mock_uid_' + email.replace(/[^a-zA-Z0-9]/g, '');
    } else {
      // Verify real Firebase ID token
      try {
        const decodedToken = await auth.verifyIdToken(credential);
        uid = decodedToken.uid;
        email = decodedToken.email;
        name = decodedToken.name || decodedToken.email.split('@')[0];
      } catch (err) {
        console.error('Firebase Google Token verification failed:', err.message);
        return res.status(400).json({ success: false, message: 'Invalid Firebase Google ID token' });
      }
    }

    if (!email) {
      return res.status(400).json({ success: false, message: 'Could not extract email from Google account' });
    }

    const sanitizedEmail = email.trim().toLowerCase();
    
    // Check Firestore for user profile
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    let isNewUser = false;
    let user;

    if (!userDoc.exists) {
      // If user does not exist and no role selected yet, request role from client
      if (!role) {
        return res.status(200).json({
          success: true,
          needsRole: true,
          email: sanitizedEmail,
          name: name,
        });
      }

      // Create new user record in Firestore
      isNewUser = true;
      user = {
        id: uid,
        name: name,
        email: sanitizedEmail,
        role: role,
        isVerified: true,
        createdAt: new Date().toISOString()
      };
      await userRef.set(user);
    } else {
      user = {
        id: uid,
        ...userDoc.data()
      };
    }

    res.status(200).json({
      success: true,
      token: credential, // Client will send this in Authorization headers
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: true
      },
      isNewUser,
    });
  } catch (error) {
    console.error('Firebase Google Auth controller error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during Google authentication' });
  }
};

// Legacy handlers disabled/redirected to Google flow
export const register = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Please register using Google Account' });
};

export const login = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Please sign in using Google Account' });
};

export const forgotPassword = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Password recovery is managed by Google Auth' });
};

export const resetPassword = async (req, res) => {
  return res.status(400).json({ success: false, message: 'Password reset is managed by Google Auth' });
};
