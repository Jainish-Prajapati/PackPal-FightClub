const { db } = require('../db/index');
const { items, events } = require('../db/schema');
const { eq, and } = require('drizzle-orm');
const { v4: uuidv4 } = require('uuid');

/**
 * Create a new item
 * @route POST /api/items
 * @access Private
 */
exports.createItem = async (req, res) => {
  try {
    const { name, description, quantity, eventId, isPacked, isShared, priority, status, categoryId, assignedToId } = req.body;
    
    if (!name || !eventId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and eventId'
      });
    }
    
    // Check if event exists and user has access to it
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
    
    // Check if user owns the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add items to this event'
      });
    }
    
    // Create new item
    const newItem = {
      id: uuidv4(),
      name,
      description,
      quantity,
      isPacked: isPacked || false,
      isShared: isShared || false,
      priority: priority || 'medium',
      status: status || 'not_started',
      categoryId: categoryId || null,
      eventId,
      assignedToId: assignedToId || req.user.id,
      createdById: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Creating new item:', newItem);
    await db.insert(items).values(newItem);
    
    return res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item: newItem
    });
  } catch (error) {
    console.error('Create item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all items for an event
 * @route GET /api/items/event/:eventId
 * @access Private
 */
exports.getEventItems = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`Getting items for event ${eventId}`);
    
    // Check if event exists and user has access to it
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
    
    // Check if user owns the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view items for this event'
      });
    }
    
    // Get all items for the event
    const eventItems = await db.select()
      .from(items)
      .where(eq(items.eventId, eventId));
    
    console.log(`Found ${eventItems.length} items for event ${eventId}`);
    
    return res.status(200).json({
      success: true,
      items: eventItems
    });
  } catch (error) {
    console.error('Get event items error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get a single item by ID
 * @route GET /api/items/:id
 * @access Private
 */
exports.getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get item
    const itemResults = await db.select()
      .from(items)
      .where(eq(items.id, id));
    
    if (!itemResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    const item = itemResults[0];
    
    // Check if user has access to the event this item belongs to
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, item.eventId));
    
    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const event = eventResults[0];
    
    // Check if user owns the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this item'
      });
    }
    
    return res.status(200).json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Get item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an item
 * @route PUT /api/items/:id
 * @access Private
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, quantity, isPacked, isShared, priority, assignedToId, status, categoryId } = req.body;
    
    console.log(`Updating item ${id} with data:`, req.body);
    
    // Get item
    const itemResults = await db.select()
      .from(items)
      .where(eq(items.id, id));
    
    if (!itemResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    const item = itemResults[0];
    
    // Check if user has access to the event this item belongs to
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, item.eventId));
    
    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const event = eventResults[0];
    
    // Check if user owns the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this item'
      });
    }
    
    // Update item
    await db.update(items)
      .set({
        name: name || item.name,
        description: description !== undefined ? description : item.description,
        quantity: quantity !== undefined ? quantity : item.quantity,
        isPacked: isPacked !== undefined ? isPacked : item.isPacked,
        isShared: isShared !== undefined ? isShared : item.isShared,
        priority: priority || item.priority,
        status: status || item.status,
        categoryId: categoryId || item.categoryId,
        assignedToId: assignedToId || item.assignedToId,
        updatedAt: new Date()
      })
      .where(eq(items.id, id));
    
    // Get updated item
    const updatedItemResults = await db.select()
      .from(items)
      .where(eq(items.id, id));
    
    return res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      item: updatedItemResults[0]
    });
  } catch (error) {
    console.error('Update item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete an item
 * @route DELETE /api/items/:id
 * @access Private
 */
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get item
    const itemResults = await db.select()
      .from(items)
      .where(eq(items.id, id));
    
    if (!itemResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    const item = itemResults[0];
    
    // Check if user has access to the event this item belongs to
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, item.eventId));
    
    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const event = eventResults[0];
    
    // Check if user owns the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this item'
      });
    }
    
    // Delete item
    await db.delete(items)
      .where(eq(items.id, id));
    
    return res.status(200).json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update an item's status
 * @route PUT /api/items/:id/status
 * @access Private
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }
    
    console.log(`Updating item ${id} status to ${status}`);
    
    // Get item
    const itemResults = await db.select()
      .from(items)
      .where(eq(items.id, id));
    
    if (!itemResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }
    
    const item = itemResults[0];
    
    // Check if user has access to the event this item belongs to
    const eventResults = await db.select()
      .from(events)
      .where(eq(events.id, item.eventId));
    
    if (!eventResults.length) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const event = eventResults[0];
    
    // Check if user owns the event
    if (event.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this item'
      });
    }
    
    // Update item status
    await db.update(items)
      .set({
        status,
        // Update isPacked to true if status is 'packed' or 'delivered'
        isPacked: ['packed', 'delivered'].includes(status),
        updatedAt: new Date()
      })
      .where(eq(items.id, id));
    
    // Get updated item
    const updatedItemResults = await db.select()
      .from(items)
      .where(eq(items.id, id));
    
    return res.status(200).json({
      success: true,
      message: 'Item status updated successfully',
      item: updatedItemResults[0]
    });
  } catch (error) {
    console.error('Update item status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating item status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 