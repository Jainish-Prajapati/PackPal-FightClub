const User = require('./User');
const Event = require('./Event');
const EventMember = require('./EventMember');
const ItemCategory = require('./ItemCategory');
const Item = require('./Item');
const ItemHistory = require('./ItemHistory');
const Notification = require('./Notification');

// Define relationships
// User - Event (through EventMember)
User.belongsToMany(Event, { through: EventMember, foreignKey: 'userId' });
Event.belongsToMany(User, { through: EventMember, foreignKey: 'eventId' });

// Event - Owner (User)
Event.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Event, { as: 'ownedEvents', foreignKey: 'ownerId' });

// EventMember - User and Event
EventMember.belongsTo(User, { foreignKey: 'userId' });
EventMember.belongsTo(Event, { foreignKey: 'eventId' });
User.hasMany(EventMember, { foreignKey: 'userId' });
Event.hasMany(EventMember, { foreignKey: 'eventId' });

// Event - ItemCategory
Event.hasMany(ItemCategory, { foreignKey: 'eventId' });
ItemCategory.belongsTo(Event, { foreignKey: 'eventId' });

// ItemCategory - Item
ItemCategory.hasMany(Item, { foreignKey: 'categoryId' });
Item.belongsTo(ItemCategory, { foreignKey: 'categoryId' });

// Event - Item
Event.hasMany(Item, { foreignKey: 'eventId' });
Item.belongsTo(Event, { foreignKey: 'eventId' });

// User - Item (assigned to)
User.hasMany(Item, { as: 'assignedItems', foreignKey: 'assignedToId' });
Item.belongsTo(User, { as: 'assignedTo', foreignKey: 'assignedToId' });

// User - Item (created by)
User.hasMany(Item, { as: 'createdItems', foreignKey: 'createdById' });
Item.belongsTo(User, { as: 'createdBy', foreignKey: 'createdById' });

// Item - ItemHistory
Item.hasMany(ItemHistory, { foreignKey: 'itemId' });
ItemHistory.belongsTo(Item, { foreignKey: 'itemId' });

// User - ItemHistory
User.hasMany(ItemHistory, { foreignKey: 'userId' });
ItemHistory.belongsTo(User, { foreignKey: 'userId' });

// Event - ItemHistory
Event.hasMany(ItemHistory, { foreignKey: 'eventId' });
ItemHistory.belongsTo(Event, { foreignKey: 'eventId' });

// User - Notification
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Event - Notification
Event.hasMany(Notification, { foreignKey: 'eventId' });
Notification.belongsTo(Event, { foreignKey: 'eventId' });

// Item - Notification
Item.hasMany(Notification, { foreignKey: 'itemId' });
Notification.belongsTo(Item, { foreignKey: 'itemId' });

module.exports = {
  User,
  Event,
  EventMember,
  ItemCategory,
  Item,
  ItemHistory,
  Notification
}; 