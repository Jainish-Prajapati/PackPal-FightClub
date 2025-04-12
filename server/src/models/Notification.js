const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  eventId: {
    type: DataTypes.UUID,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  itemId: {
    type: DataTypes.UUID,
    references: {
      model: 'Items',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'invite', 
      'item_assigned', 
      'item_status_changed', 
      'event_updated', 
      'reminder', 
      'mention', 
      'deadline_approaching'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE
  },
  actionUrl: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSON
  }
}, {
  timestamps: true
});

module.exports = Notification; 