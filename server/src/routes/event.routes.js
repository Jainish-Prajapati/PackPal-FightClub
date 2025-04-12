const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const { authenticate, authorize } = require('../middleware/auth');

// All event routes require authentication
router.use(authenticate);

// Create a new event
router.post('/', eventController.createEvent);

// Get all events for the logged-in user
router.get('/', eventController.getMyEvents);

// Get a single event by ID
router.get('/:id', eventController.getEventById);

// Update an event
router.put('/:id', eventController.updateEvent);

// Delete an event
router.delete('/:id', eventController.deleteEvent);

// Update event status
router.put('/:id/status', eventController.updateEventStatus);

// End/Close an event (owner only)
router.put('/:id/end', eventController.endEvent);

// Invite users to an event (owner or admin)
router.post('/:id/invite', eventController.inviteToEvent);

// Remove a member from an event (owner or admin)
router.delete('/:id/members/:memberId', eventController.removeMember);

// Update event member role
router.put('/:id/members/:memberId/role', eventController.updateMemberRole);

// Update member name (owner or admin)
router.put('/:id/members/update-name', eventController.updateMemberName);

module.exports = router; 