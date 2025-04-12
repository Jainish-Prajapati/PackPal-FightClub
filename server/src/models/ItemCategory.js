const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ItemCategory = sequelize.define('ItemCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  icon: {
    type: DataTypes.STRING, // Icon identifier or URL
    defaultValue: 'box'
  },
  color: {
    type: DataTypes.STRING, // Hex color code
    defaultValue: '#3b82f6'
  },
  eventId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Events',
      key: 'id'
    }
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = ItemCategory; 