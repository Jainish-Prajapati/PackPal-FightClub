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

async function updateEventsTable() {
  const client = await pool.connect();
  try {
    console.log('Connected to the database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Add source column if it doesn't exist
    await client.query(`
      ALTER TABLE "events" 
      ADD COLUMN IF NOT EXISTS "source" varchar
    `);
    console.log('Added source column');
    
    // Add destination column if it doesn't exist
    await client.query(`
      ALTER TABLE "events" 
      ADD COLUMN IF NOT EXISTS "destination" varchar
    `);
    console.log('Added destination column');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Events table updated successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating events table:', error);
  } finally {
    // Release the client
    client.release();
    console.log('Database connection closed');
    // Close the pool
    pool.end();
  }
}

// Run the function
updateEventsTable(); 