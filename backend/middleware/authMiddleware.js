import { auth, db } from '../config/firebase.js';

// Protect routes using Firebase ID Tokens
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify the Firebase ID token
      const decodedToken = await auth.verifyIdToken(token);

      // Get user from Firestore
      const userRef = db.collection('users').doc(decodedToken.uid);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        // If the user signed in but doesn't exist in our DB yet
        req.user = {
          _id: decodedToken.uid,
          uid: decodedToken.uid,
          id: decodedToken.uid,
          name: decodedToken.name || 'Firebase User',
          email: decodedToken.email,
          role: null,
          isVerified: decodedToken.email_verified || true
        };
      } else {
        const userData = userDoc.data();
        req.user = {
          _id: decodedToken.uid,
          uid: decodedToken.uid,
          id: decodedToken.uid,
          ...userData
        };
      }

      next();
    } catch (error) {
      console.error('Firebase Auth Token Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Authorize roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'none'}' is not authorized to access this route`,
      });
    }
    next();
  };
};
