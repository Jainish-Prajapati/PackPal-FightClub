const { db } = require('../db/index');
const { events, users, items, eventMembers } = require('../db/schema');
const { eq, and, or } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

/**
 * Create a new event
 * @route POST /api/events
 * @access Private (any authenticated user with admin role in other events)
 */
exports.createEvent = async (req, res) => {
  try {
    const { name, description, startDate, endDate, location, source, destination } = req.body;
    
    console.log('Creating event with data:', {
      name,
      description: description?.substring(0, 50) + (description?.length > 50 ? '...' : ''),
      startDate,
      endDate,
      location,
      source,
      destination,
      user: req.user.id
    });
    
    // Create event
    const newEvent = {
      id: uuidv4(),
      name,
      description,
      location,
      source,
      destination,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ownerId: req.user.id,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(events).values(newEvent);
    console.log('Event created successfully with ID:', newEvent.id);

    // Add the creator as an owner member
    const ownerMembership = {
      id: crypto.randomUUID(),
      eventId: newEvent.id,
      userId: req.user.id,
      role: 'owner',
      inviteStatus: 'accepted',
      inviteToken: null,
      inviteEmail: req.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(eventMembers).values(ownerMembership);

    return res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all events for the current user
 * @route GET /api/events
 * @access Private
 */
exports.getMyEvents = async (req, res) => {
  try {
    // Find all events owned by the user
    const userEvents = await db.select({
      id: events.id,
      name: events.name,
      description: events.description,
      location: events.location,
      startDate: events.startDate,
      endDate: events.endDate,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt
    })
    .from(events)
    .where(eq(events.ownerId, req.user.id));

    return res.status(200).json({
      success: true,
      events: userEvents
    });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a single event by ID
 * @route GET /api/events/:id
 * @access Private (only event owner)
 */
exports.getEventById = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Get event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of this event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this event'
      });
    }

    // Get event owner details
    const ownerResults = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email
    })
    .from(users)
    .where(eq(users.id, event.ownerId));

    const owner = ownerResults.length ? ownerResults[0] : null;

    // Get items for this event
    const eventItems = await db.select()
      .from(items)
      .where(eq(items.eventId, eventId));

    // Get event members
    const memberResults = await db.select({
      id: eventMembers.id,
      userId: eventMembers.userId,
      role: eventMembers.role,
      inviteStatus: eventMembers.inviteStatus,
      inviteEmail: eventMembers.inviteEmail,
      createdAt: eventMembers.createdAt
    })
    .from(eventMembers)
    .where(eq(eventMembers.eventId, eventId));
    
    // Get full user details for each member
    const members = [];
    for (const member of memberResults) {
      if (member.userId) {
        const userResults = await db.select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email
        })
        .from(users)
        .where(eq(users.id, member.userId));
        
        if (userResults.length) {
          members.push({
            ...member,
            user: userResults[0]
          });
        }
      } else if (member.inviteEmail) {
        members.push({
          ...member,
          user: {
            email: member.inviteEmail,
            firstName: 'Invited',
            lastName: 'User'
          }
        });
      }
    }

    // Combine data
    const eventData = {
      ...event,
      owner,
      items: eventItems,
      members: members
    };

    return res.status(200).json({
      success: true,
      event: eventData
    });
  } catch (error) {
    console.error('Get event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an event
 * @route PUT /api/events/:id
 * @access Private (owner only)
 */
exports.updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, description, startDate, endDate, location, source, destination } = req.body;

    // Find event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of this event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this event'
      });
    }

    // Update event
    await db.update(events)
      .set({
        name: name || event.name,
        description: description !== undefined ? description : event.description,
        startDate: startDate ? new Date(startDate) : event.startDate,
        endDate: endDate ? new Date(endDate) : event.endDate,
        location: location || event.location,
        source: source || event.source,
        destination: destination || event.destination,
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));

    // Get updated event
    const updatedEventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEventResults[0]
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an event
 * @route DELETE /api/events/:id
 * @access Private (owner only)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

    // Find event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of this event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this event'
      });
    }

    // Delete event (this will cascade delete all related items)
    await db.delete(events)
      .where(eq(events.id, eventId));

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Invite users to an event
 * @route POST /api/events/:id/invite
 * @access Private (owner or admin)
 */
exports.inviteToEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { invites } = req.body;

    console.log(`Processing invitation request for event ${eventId}:`, invites);

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a list of invites'
      });
    }

    // Find event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of the event or has an admin role
    // First check if user is owner
    const isOwner = event.ownerId === req.user.id;
    
    // If not owner, check if user is an admin
    let isAdmin = false;
    if (!isOwner) {
      const memberResults = await db.select()
        .from(eventMembers)
        .where(
          and(
            eq(eventMembers.eventId, eventId),
            eq(eventMembers.userId, req.user.id),
            eq(eventMembers.role, 'admin'),
            eq(eventMembers.inviteStatus, 'accepted')
          )
        );
      
      isAdmin = memberResults.length > 0;
    }
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite users to this event'
      });
    }

    const results = [];
    
    // Setup email transporter
    let transporter;
    try {
      // Check if we have Gmail configuration
      if (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com')) {
        console.log('Setting up Gmail transporter');
        // Gmail specific configuration
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else if (process.env.SMTP_HOST) {
        // Regular SMTP configuration
        console.log('Setting up custom SMTP transporter');
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        // Use Ethereal for testing if no SMTP settings
        console.log('No SMTP settings found, creating test account');
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('Using test email account:', testAccount.user);
      }
      
      // Verify SMTP connection
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (emailError) {
      console.error('Failed to setup email transporter:', emailError);
      // Continue with invitations, but note that emails won't be sent
    }

    // Process each invite
    for (const invite of invites) {
      const { email, role = 'member', firstName = 'New', lastName = 'User' } = invite;

      // Check if user with email exists
      const userResults = await db.select()
        .from(users)
        .where(eq(users.email, email));

      const existingUser = userResults.length > 0 ? userResults[0] : null;
      
      // Check if invitation already exists
      const inviteCondition = existingUser ? 
        or(
          eq(eventMembers.inviteEmail, email),
          eq(eventMembers.userId, existingUser.id)
        ) : 
        eq(eventMembers.inviteEmail, email);
      
      const existingInviteResults = await db.select()
        .from(eventMembers)
        .where(
          and(
            inviteCondition,
            eq(eventMembers.eventId, eventId)
          )
        );

      if (existingInviteResults.length > 0) {
        results.push({
          email,
          status: 'already_invited',
          message: 'User already invited'
        });
        continue;
      }

      // Generate a temporary password for new users
      const tempPassword = crypto.randomBytes(8).toString('hex');

      // Create or update user and add them to the event
      let userId = null;
      let newUserCreated = false;
      
      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create a new user with the provided email and a temporary password
        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);
        
        // Create a new user
        try {
          const newUser = {
            id: crypto.randomUUID(),
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            role: 'member',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await db.insert(users).values(newUser);
          userId = newUser.id;
          newUserCreated = true;
          console.log(`Created new user for ${email}`);
        } catch (userCreateError) {
          console.error(`Failed to create user for ${email}:`, userCreateError);
          results.push({
            email,
            status: 'error',
            message: 'Failed to create user'
          });
          continue;
        }
      }

      // Create event membership
      try {
        const membership = {
          id: crypto.randomUUID(),
          eventId: eventId,
          userId: userId,
          role: role,
          inviteStatus: 'accepted',
          inviteToken: null,
          inviteEmail: email,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.insert(eventMembers).values(membership);
        console.log(`Created event membership for ${email} with accepted status`);
      } catch (membershipError) {
        console.error(`Failed to create membership for ${email}:`, membershipError);
        results.push({
          email,
          status: 'error',
          message: 'Failed to create membership'
        });
        continue;
      }

      // Send email notification
      if (transporter) {
        try {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          
          // Prepare email content
          const emailContent = `
            <h1>You've been invited to join ${event.name}!</h1>
            <p>${req.user.firstName} ${req.user.lastName} has invited you to join their event.</p>
            <p><strong>Event:</strong> ${event.name}</p>
            <p><strong>Your Role:</strong> ${role}</p>
            ${newUserCreated ? `
            <p><strong>We've created an account for you with the following credentials:</strong></p>
            <p>Email: ${email}</p>
            <p>Temporary Password: ${tempPassword}</p>
            <p>Please change your password after logging in for the first time.</p>
            ` : ''}
            <p>To access this event, please login at: ${frontendUrl}</p>
            <p>Your account has been automatically added to the event.</p>
          `;
          
          const mailOptions = {
            from: `"PackPal" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@packpal.example.com'}>`,
            to: email,
            subject: `Invitation to join ${event.name} on PackPal`,
            html: emailContent
          };
          
          console.log('Attempting to send email with the following configuration:');
          console.log('- SMTP Host:', process.env.SMTP_HOST || 'smtp.ethereal.email');
          console.log('- SMTP Port:', process.env.SMTP_PORT || 587);
          console.log('- SMTP Secure:', process.env.SMTP_SECURE === 'true' ? 'Yes' : 'No');
          console.log('- From:', mailOptions.from);
          console.log('- To:', email);
          
          const info = await transporter.sendMail(mailOptions);
          
          console.log(`Email sent to ${email}: ${info.messageId}`);
          if (info.accepted && info.accepted.length > 0) {
            console.log('Email was accepted by the SMTP server for delivery');
          }
          if (info.rejected && info.rejected.length > 0) {
            console.log('Email was rejected for these recipients:', info.rejected);
          }
          
          if (process.env.NODE_ENV !== 'production' && info.messageId) {
            // For Ethereal emails, provide the preview URL
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
              console.log(`Preview URL: ${previewUrl}`);
            }
          }
        } catch (emailSendError) {
          console.error(`Failed to send invitation email to ${email}:`, emailSendError);
          console.error('Email Error Details:', emailSendError.message);
          if (emailSendError.code) {
            console.error('Error Code:', emailSendError.code);
          }
          if (emailSendError.command) {
            console.error('SMTP Command:', emailSendError.command);
          }
          // Continue with the process even if email fails
        }
      } else {
        console.log(`Would send email to ${email} with temp password ${tempPassword} (if email was configured)`);
      }

      results.push({
        email,
        status: 'invited',
        message: 'Invitation sent successfully',
        tempPassword: newUserCreated ? tempPassword : undefined
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Invitations processed',
      results
    });
  } catch (error) {
    console.error('Invite users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error inviting users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove a member from an event
 * @route DELETE /api/events/:id/members/:memberId
 * @access Private (owner or admin)
 */
exports.removeMember = async (req, res) => {
  try {
    const { id: eventId, memberId } = req.params;
    
    // Find event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of the event
    const isOwner = event.ownerId === req.user.id;
    
    // If not owner, check if user is an admin
    let isAdmin = false;
    if (!isOwner) {
      const memberResults = await db.select()
        .from(eventMembers)
        .where(
          and(
            eq(eventMembers.eventId, eventId),
            eq(eventMembers.userId, req.user.id),
            eq(eventMembers.role, 'admin'),
            eq(eventMembers.inviteStatus, 'accepted')
          )
        );
      
      isAdmin = memberResults.length > 0;
    }
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to remove members from this event'
      });
    }
    
    // Find the member to be removed
    const memberToRemoveResults = await db.select()
      .from(eventMembers)
      .where(eq(eventMembers.id, memberId));
    
    if (!memberToRemoveResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    const memberToRemove = memberToRemoveResults[0];
    
    // Don't allow removing the owner
    if (memberToRemove.userId === event.ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot remove the event owner'
      });
    }
    
    // Delete the member
    await db.delete(eventMembers)
      .where(eq(eventMembers.id, memberId));
    
    return res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * End/Close an event
 * @route PUT /api/events/:id/end
 * @access Private (owner only)
 */
exports.endEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Find event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of this event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to end this event'
      });
    }
    
    // Check if event is already ended
    if (event.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'Event has already been ended'
      });
    }
    
    // Update event status to ended
    await db.update(events)
      .set({
        status: 'ended',
        updatedAt: new Date()
      })
      .where(eq(events.id, eventId));
      
    // Get updated event
    const updatedEventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));
      
    return res.status(200).json({
      success: true,
      message: 'Event ended successfully',
      event: updatedEventResults[0]
    });
  } catch (error) {
    console.error('End event error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error ending event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update a member's role in an event
 * @route PUT /api/events/:id/members/:memberId/role
 * @access Private (owner only)
 */
exports.updateMemberRole = async (req, res) => {
  try {
    const { id: eventId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role provided'
      });
    }
    
    // Find event
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, eventId));

    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResults[0];

    // Check if user is the owner of the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the event owner can update member roles'
      });
    }
    
    // Find the member to be updated
    const memberToUpdateResults = await db.select()
      .from(eventMembers)
      .where(eq(eventMembers.id, memberId));
    
    if (!memberToUpdateResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    const memberToUpdate = memberToUpdateResults[0];
    
    // Don't allow changing the role of the event owner
    if (memberToUpdate.userId === event.ownerId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot change the role of the event owner'
      });
    }
    
    // Update the member's role
    await db.update(eventMembers)
      .set({
        role: role,
        updatedAt: new Date()
      })
      .where(eq(eventMembers.id, memberId));
    
    return res.status(200).json({
      success: true,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Update member role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating member role',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 