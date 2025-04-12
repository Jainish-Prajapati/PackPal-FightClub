const { Pool } = require('pg');
require('dotenv').config();

const createDatabase = async () => {
  // Connect to the default postgres database first
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default postgres database
  });

  try {
    // Check if the database already exists
    const result = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME]
    );

    // Create the database if it doesn't exist
    if (result.rows.length === 0) {
      console.log(`Database "${process.env.DB_NAME}" does not exist. Creating it now...`);
      await pool.query(`CREATE DATABASE ${process.env.DB_NAME}`);
      console.log(`Database "${process.env.DB_NAME}" created successfully`);
    } else {
      console.log(`Database "${process.env.DB_NAME}" already exists`);
    }
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    // Close the connection
    await pool.end();
  }
};

// If this file is run directly (not imported)
if (require.main === module) {
  createDatabase();
}

module.exports = { createDatabase }; 