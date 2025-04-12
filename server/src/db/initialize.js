const { db, pool, connectDatabase } = require('./index');
const { users, events, items } = require('./schema');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const initializeDatabase = async () => {
  try {
    // Ensure database connection is established
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Database connection failed. Cannot initialize database.');
      return false;
    }

    console.log('Warning: Force resetting all tables! This will delete all data.');
    
    // Get all tables in the database
    console.log('Finding all tables in the database...');
    const tablesResult = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    const tables = tablesResult.rows.map(row => row.tablename);
    console.log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    
    // Drop all tables
    console.log('Dropping all tables...');
    
    // Temporarily disable foreign key checks to allow dropping tables in any order
    await pool.query('SET session_replication_role = replica');
    
    // Drop all tables
    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      await pool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    
    // Find all enums/types
    console.log('Finding all custom types...');
    const typesResult = await pool.query(`
      SELECT typname FROM pg_type 
      JOIN pg_catalog.pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE typtype = 'e' AND nspname = 'public'
    `);
    
    const types = typesResult.rows.map(row => row.typname);
    console.log(`Found ${types.length} custom types: ${types.join(', ') || 'none'}`);
    
    // Drop all types
    for (const type of types) {
      console.log(`Dropping type: ${type}`);
      await pool.query(`DROP TYPE IF EXISTS "${type}" CASCADE`);
    }
    
    // Explicitly drop Sequelize enums that might be left over
    const seqEnums = [
      'enum_Users_role',
      'enum_Events_status',
      'enum_EventMembers_role',
      'enum_EventMembers_inviteStatus',
      'enum_Items_status',
      'enum_Items_priority',
      'enum_ItemHistories_action',
      'enum_Notifications_type'
    ];
    
    for (const enumName of seqEnums) {
      await pool.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE`);
    }
    
    // Reset session replication role
    await pool.query('SET session_replication_role = default');
    
    console.log('All tables and types dropped successfully');

    // Create tables directly using SQL
    console.log('Creating tables...');
    
    // Create role enum
    await pool.query(`
      CREATE TYPE role AS ENUM ('owner', 'admin', 'member', 'viewer');
    `);
    
    // Create users table
    await pool.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "first_name" VARCHAR NOT NULL,
        "last_name" VARCHAR NOT NULL,
        "email" VARCHAR NOT NULL UNIQUE,
        "password" VARCHAR NOT NULL,
        "role" role DEFAULT 'member',
        "reset_password_token" VARCHAR,
        "reset_password_expire" TIMESTAMP,
        "last_login" TIMESTAMP,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);
    
    // Create events table
    await pool.query(`
      CREATE TABLE "events" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "location" VARCHAR,
        "start_date" TIMESTAMP,
        "end_date" TIMESTAMP,
        "owner_id" UUID REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);
    
    // Create items table
    await pool.query(`
      CREATE TABLE "items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR NOT NULL,
        "description" TEXT,
        "quantity" VARCHAR,
        "is_packed" BOOLEAN DEFAULT false,
        "is_shared" BOOLEAN DEFAULT false,
        "priority" VARCHAR DEFAULT 'medium',
        "event_id" UUID NOT NULL REFERENCES "events"("id"),
        "assigned_to_id" UUID REFERENCES "users"("id"),
        "created_by_id" UUID NOT NULL REFERENCES "users"("id"),
        "created_at" TIMESTAMP DEFAULT now(),
        "updated_at" TIMESTAMP DEFAULT now()
      );
    `);
    
    console.log('Tables created successfully');
    
    // Create default admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    await db.insert(users).values({
      id: uuidv4(),
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@packpal.com',
      password: hashedPassword,
      role: 'owner',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('Default admin user created');
    
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
};

// Execute directly if this file is run directly
if (require.main === module) {
  initializeDatabase()
    .then(success => {
      console.log(`Database initialization ${success ? 'succeeded' : 'failed'}`);
      pool.end();
      process.exit(0);
    })
    .catch(err => {
      console.error('Unhandled error during database initialization:', err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { initializeDatabase }; 