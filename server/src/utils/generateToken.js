const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for user authentication
 * 
 * @param {Object} user - User object containing id and other user data
 * @param {Response} res - Express response object for setting cookies
 * @returns {String} - The generated JWT token
 */
const generateToken = (user, res = null) => {
  // Create token payload
  const payload = {
    id: typeof user === 'object' ? user.id : user,
    role: user.role || 'member'
  };

  // Generate JWT token
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

  // If response object is provided, set cookie
  if (res) {
    const cookieOptions = {
      expires: new Date(
        Date.now() + 
        (process.env.JWT_COOKIE_EXPIRES_IN || 7) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    };

    res.cookie('token', token, cookieOptions);
  }

  return token;
};

module.exports = generateToken; 