const { db } = require('../db/index');
const { events, users, items } = require('../db/schema');
const { eq, and } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new event
 * @route POST /api/events
 * @access Private
 */
exports.createEvent = async (req, res) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;
    
    // Create event
    const newEvent = {
      id: uuidv4(),
      name,
      description,
      location,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ownerId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(events).values(newEvent);

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

    // Combine data
    const eventData = {
      ...event,
      owner,
      items: eventItems
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
    const { name, description, startDate, endDate, location } = req.body;

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

    if (!invites || !Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a list of invites'
      });
    }

    // Check if user is a member with owner or admin role
    const membership = await EventMember.findOne({
      where: {
        userId: req.user.id,
        eventId,
        role: { [Op.in]: ['owner', 'admin'] },
        inviteStatus: 'accepted'
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to invite users to this event'
      });
    }

    // Find event
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const results = [];

    // Process each invite
    for (const invite of invites) {
      const { email, role = 'member' } = invite;

      // Check if user with email exists
      const existingUser = await User.findOne({ where: { email } });
      let userId = null;

      // Check if invitation already exists
      const existingInvite = await EventMember.findOne({
        where: {
          [Op.or]: [
            { inviteEmail: email },
            { userId: existingUser ? existingUser.id : null }
          ],
          eventId
        }
      });

      if (existingInvite) {
        results.push({
          email,
          status: 'already_invited',
          message: 'User already invited'
        });
        continue;
      }

      // Create invite token
      const inviteToken = uuidv4();

      // Create event membership record
      if (existingUser) {
        userId = existingUser.id;
      }

      await EventMember.create({
        userId,
        eventId,
        role,
        inviteStatus: 'pending',
        inviteToken,
        inviteEmail: email
      });

      // TODO: Send email invitation

      results.push({
        email,
        status: 'invited',
        message: 'Invitation sent successfully'
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