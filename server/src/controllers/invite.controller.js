const { db } = require('../db/index');
const { eventMembers, events, users } = require('../db/schema');
const { eq } = require('drizzle-orm');

/**
 * Get invitation details by token
 * @route GET /api/invites/:token
 * @access Public
 */
exports.getInviteByToken = async (req, res) => {
  try {
    const { token } = req.params;
    
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
    
    // Get event details
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, invitation.eventId));
    
    const event = eventResults.length ? eventResults[0] : null;
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user exists
    let userExists = false;
    let firstName = null;
    let lastName = null;
    
    if (invitation.userId) {
      const userResults = await db.select()
        .from(users)
        .where(eq(users.id, invitation.userId));
      
      if (userResults.length) {
        userExists = true;
        firstName = userResults[0].firstName;
        lastName = userResults[0].lastName;
      }
    } else if (invitation.inviteEmail) {
      const userResults = await db.select()
        .from(users)
        .where(eq(users.email, invitation.inviteEmail));
      
      if (userResults.length) {
        userExists = true;
        firstName = userResults[0].firstName;
        lastName = userResults[0].lastName;
      }
    }
    
    // Get inviter details
    let inviterName = null;
    if (event.ownerId) {
      const ownerResults = await db.select()
        .from(users)
        .where(eq(users.id, event.ownerId));
      
      if (ownerResults.length) {
        inviterName = `${ownerResults[0].firstName} ${ownerResults[0].lastName}`;
      }
    }
    
    return res.status(200).json({
      success: true,
      invite: {
        id: invitation.id,
        email: invitation.inviteEmail,
        role: invitation.role,
        eventId: event.id,
        eventName: event.name,
        userExists,
        firstName,
        lastName,
        inviterName
      }
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving invitation',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 