const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');
const { authenticate } = require('../middleware/auth');

// All item routes require authentication
router.use(authenticate);

// Create a new item
router.post('/', itemController.createItem);

// Get all items for an event
router.get('/event/:eventId', itemController.getEventItems);

// Get a single item by ID
router.get('/:id', itemController.getItemById);

// Update an item
router.put('/:id', itemController.updateItem);

// Update an item's status
router.put('/:id/status', itemController.updateItemStatus);

// Delete an item
router.delete('/:id', itemController.deleteItem);

module.exports = router; 