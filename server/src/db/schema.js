const { pgTable, uuid, varchar, text, timestamp, boolean, foreignKey, pgEnum } = require('drizzle-orm/pg-core');

// Role enum
const roleEnum = pgEnum('role', ['owner', 'admin', 'member', 'viewer']);

// Invite status enum
const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'declined']);

// User table
const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  role: roleEnum('role').default('member'),
  resetPasswordToken: varchar('reset_password_token'),
  resetPasswordExpire: timestamp('reset_password_expire'),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Event table
const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  location: varchar('location'),
  source: varchar('source'),
  destination: varchar('destination'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  ownerId: uuid('owner_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Event members table
const eventMembers = pgTable('event_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  role: roleEnum('role').default('member'),
  inviteStatus: inviteStatusEnum('invite_status').default('pending'),
  inviteToken: varchar('invite_token'),
  inviteEmail: varchar('invite_email'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Item table
const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  description: text('description'),
  quantity: varchar('quantity'),
  isPacked: boolean('is_packed').default(false),
  isShared: boolean('is_shared').default(false),
  priority: varchar('priority').default('medium'),
  status: varchar('status').default('not_started'),
  eventId: uuid('event_id').references(() => events.id).notNull(),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

module.exports = {
  users,
  events,
  items,
  eventMembers,
  roleEnum,
  inviteStatusEnum
};
