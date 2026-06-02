import rateLimit from 'express-rate-limit';

// Standard rate limiter for API routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for auth endpoints to prevent brute force
export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 15, // Limit each IP to 15 auth/verification attempts per 5 minutes
  message: {
    success: false,
    message: 'Too many auth or verification attempts from this IP, please try again after 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for password reset requests
export const resetLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 3, // max 3 password reset requests per minute per IP
  message: {
    success: false,
    message: 'Too many password reset requests. Please wait a minute before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
