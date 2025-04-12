const { createDatabase } = require('./createDb');
const { initializeDatabase } = require('./initialize');
const { runMigrations } = require('./migrate');

// Main function to run the complete initialization process
const runFullInitialization = async () => {
  try {
    console.log('=== Starting Full Database Initialization ===');
    
    // Step 1: Create the database if it doesn't exist
    console.log('\n--- Step 1: Creating Database ---');
    await createDatabase();
    
    // Step 2: Run migrations to ensure all tables are created
    console.log('\n--- Step 2: Running Migrations ---');
    const migrationSuccess = await runMigrations();
    if (!migrationSuccess) {
      console.error('Migration failed. Stopping initialization process.');
      process.exit(1);
    }
    
    // Step 3: Initialize database with default data
    console.log('\n--- Step 3: Initializing Database with Default Data ---');
    const initSuccess = await initializeDatabase();
    if (!initSuccess) {
      console.error('Database initialization failed.');
      process.exit(1);
    }
    
    console.log('\n=== Full Database Initialization Completed Successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('Error during full database initialization:', error);
    process.exit(1);
  }
};

// Run the initialization process
if (require.main === module) {
  runFullInitialization();
}

module.exports = { runFullInitialization }; 