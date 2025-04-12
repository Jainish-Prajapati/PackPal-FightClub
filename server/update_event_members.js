require('dotenv').config();
const { Pool } = require('pg');

// Create a new pool instance with connection details
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'packpal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function createEventMembersTable() {
  const client = await pool.connect();
  try {
    console.log('Connected to the database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Create invite_status enum if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invite_status') THEN
          CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'declined');
        END IF;
      END $$;
    `);
    console.log('Ensured invite_status enum exists');
    
    // Create event_members table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "event_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "event_id" uuid NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "role" role DEFAULT 'member',
        "invite_status" invite_status DEFAULT 'pending',
        "invite_token" varchar,
        "invite_email" varchar,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    console.log('Created event_members table if not exists');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Event members table created successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating event members table:', error);
  } finally {
    // Release the client
    client.release();
    console.log('Database connection closed');
    // Close the pool
    pool.end();
  }
}

// Run the function
createEventMembersTable(); 