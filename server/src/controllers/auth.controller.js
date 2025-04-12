const { db } = require('../db/index');
const { users } = require('../db/schema');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');
const { eq } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { eventMembers, events } = require('../db/schema');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { firstName, lastName, email, password, role } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, password'
      });
    }
    
    // Check if user exists
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser = {
      id: uuidv4(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'member',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(users).values(newUser);
    
    // Generate token
    const token = generateToken(newUser, res);
    
    console.log('User registered successfully:', newUser.id);
    
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const userResults = await db.select().from(users).where(eq(users.email, email));
    
    if (userResults.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    const user = userResults[0];

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Update last login timestamp
    await db
      .update(users)
      .set({ lastLogin: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate token
    const token = generateToken(user, res);

    // Return user data without password
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      lastLogin: new Date(),
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Logout a user
 * @route POST /api/auth/logout
 * @access Private
 */
exports.logout = (req, res) => {
  // Clear the cookie
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = req.user;

    // Return user data without password
    const userResponse = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    return res.status(200).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update password
 * @route PUT /api/auth/password
 * @access Private
 */
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide currentPassword and newPassword'
      });
    }
    
    const userId = req.user.id;
    
    // Get current user from database
    const userResults = await db.select().from(users).where(eq(users.id, userId));
    
    if (userResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = userResults[0];

    // Check if current password matches
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Health check endpoint
 * @route GET /api/auth/health
 * @access Public
 */
exports.healthCheck = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Authentication service is up and running',
    timestamp: new Date()
  });
};

/**
 * Accept event invitation
 * @route POST /api/auth/accept-invite/:token
 * @access Public
 */
exports.acceptInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    console.log(`Processing invitation acceptance for token: ${token}`);
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invitation token'
      });
    }
    
    // Find the invitation
    const inviteResults = await db.select()
      .from(eventMembers)
      .where(eq(eventMembers.inviteToken, token));
    
    if (!inviteResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found or already accepted'
      });
    }
    
    const invitation = inviteResults[0];
    
    // Make sure invitation is still pending
    if (invitation.inviteStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invitation has already been processed'
      });
    }
    
    // If the invitation has a user ID, just update the status
    if (invitation.userId) {
      // Update invitation status
      await db.update(eventMembers)
        .set({
          inviteStatus: 'accepted',
          inviteToken: null,
          updatedAt: new Date()
        })
        .where(eq(eventMembers.id, invitation.id));
      
      // Get the user info
      const userResults = await db.select()
        .from(users)
        .where(eq(users.id, invitation.userId));
      
      if (!userResults.length) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const user = userResults[0];
      
      // Get event info
      const eventResults = await db.select()
        .from(events)
        .where(eq(events.id, invitation.eventId));
      
      const event = eventResults.length ? eventResults[0] : null;
      
      // Generate token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your-jwt-secret',
        { expiresIn: '30d' }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Invitation accepted successfully',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        event: event ? {
          id: event.id,
          name: event.name
        } : null
      });
    }
    
    // If there's no user ID but there's an email, we need to create a user
    if (!invitation.userId && invitation.inviteEmail) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password is required to complete registration'
        });
      }
      
      // Check if a user with this email already exists
      const userResults = await db.select()
        .from(users)
        .where(eq(users.email, invitation.inviteEmail));
      
      let user;
      
      if (userResults.length) {
        // User exists, update the invitation with the user ID
        user = userResults[0];
        
        await db.update(eventMembers)
          .set({
            userId: user.id,
            inviteStatus: 'accepted',
            inviteToken: null,
            updatedAt: new Date()
          })
          .where(eq(eventMembers.id, invitation.id));
      } else {
        // Create a new user
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = {
          id: crypto.randomUUID(),
          firstName: req.body.firstName || 'New',
          lastName: req.body.lastName || 'User',
          email: invitation.inviteEmail,
          password: hashedPassword,
          role: 'member',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.insert(users).values(newUser);
        user = newUser;
        
        // Update the invitation with the new user ID
        await db.update(eventMembers)
          .set({
            userId: user.id,
            inviteStatus: 'accepted',
            inviteToken: null,
            updatedAt: new Date()
          })
          .where(eq(eventMembers.id, invitation.id));
      }
      
      // Get event info
      const eventResults = await db.select()
        .from(events)
        .where(eq(events.id, invitation.eventId));
      
      const event = eventResults.length ? eventResults[0] : null;
      
      // Generate token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'your-jwt-secret',
        { expiresIn: '30d' }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Invitation accepted and registration completed',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        event: event ? {
          id: event.id,
          name: event.name
        } : null
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Invalid invitation data'
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error accepting invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 