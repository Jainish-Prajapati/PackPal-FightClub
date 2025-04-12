const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { db, pool, connectDatabase } = require('./index');
const path = require('path');

// Function to run migrations using Drizzle
const runMigrations = async () => {
  try {
    // Ensure database connection is established
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Database connection failed. Cannot run migrations.');
      process.exit(1);
    }

    console.log('Starting database migration...');

    // Use Drizzle's migration system to apply migrations from the migrations directory
    const migrationsFolder = path.join(__dirname, 'migrations');
    await migrate(db, { migrationsFolder });
    
    console.log('Migrations completed successfully.');
    
    // Close the connection pool
    await pool.end();
    
    console.log('Database connection closed.');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    // Ensure we close the connection pool even if migrations fail
    try {
      await pool.end();
    } catch (err) {
      console.error('Error closing pool:', err);
    }
    return false;
  }
};

// If this file is run directly (not imported)
if (require.main === module) {
  runMigrations()
    .then(success => {
      console.log(`Migration ${success ? 'completed successfully' : 'failed'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error during migration:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
