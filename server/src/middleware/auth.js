const jwt = require('jsonwebtoken');
const { db } = require('../db/index');
const { users } = require('../db/schema');
const { eq, and } = require('drizzle-orm');

// Middleware to authenticate users
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Get token from cookie
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userResult = await db.select().from(users).where(eq(users.id, decoded.id));

    if (userResult.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult[0];

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};

// Middleware to check user role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource`
      });
    }
    
    next();
  };
};

// Middleware to check event member permissions
exports.checkEventMemberRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const eventId = req.params.eventId || req.body.eventId;
      
      if (!eventId) {
        return res.status(400).json({
          success: false,
          message: 'Event ID is required'
        });
      }

      // If user is a global owner, allow access
      if (req.user.role === 'owner') {
        return next();
      }

      // Check event membership and role
      const { EventMember } = require('../models');
      const membership = await EventMember.findOne({
        where: {
          userId: req.user.id,
          eventId,
          inviteStatus: 'accepted'
        }
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this event'
        });
      }

      if (!requiredRoles.includes(membership.role)) {
        return res.status(403).json({
          success: false,
          message: `Your role '${membership.role}' does not have permission for this action`
        });
      }

      // Add membership to request
      req.eventMembership = membership;
      next();
    } catch (error) {
      console.error('Event member role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error checking event member permissions'
      });
    }
  };
}; 