const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ItemHistory = sequelize.define('ItemHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Items',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.ENUM('created', 'updated', 'deleted', 'status_changed', 'assigned', 'unassigned'),
    allowNull: false
  },
  previousValue: {
    type: DataTypes.JSON
  },
  newValue: {
    type: DataTypes.JSON
  },
  field: {
    type: DataTypes.STRING
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Events',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

module.exports = ItemHistory; 