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

async function updateItemsTable() {
  const client = await pool.connect();
  try {
    console.log('Connected to the database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Add status column if it doesn't exist
    await client.query(`
      ALTER TABLE "items" 
      ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'not_started'
    `);
    console.log('Added status column to items table');
    
    // Update existing items status based on isPacked field
    await client.query(`
      UPDATE "items" SET "status" = 
        CASE 
          WHEN "is_packed" = true THEN 'packed'
          ELSE 'not_started'
        END
      WHERE "status" IS NULL
    `);
    console.log('Updated status values based on isPacked field');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Items table updated successfully');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error updating items table:', error);
  } finally {
    // Release the client
    client.release();
    console.log('Database connection closed');
    // Close the pool
    pool.end();
  }
}

// Run the function
updateItemsTable(); 