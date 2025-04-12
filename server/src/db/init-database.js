const { db, pool, connectDatabase } = require('./index');
const { users } = require('./schema');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

// Function to initialize the database
const initializeDatabase = async () => {
  try {
    // Ensure database connection is established
    const connected = await connectDatabase();
    if (!connected) {
      console.error('Database connection failed. Cannot initialize database.');
      return false;
    }

    console.log('Checking for admin user...');
    
    // Check if admin user exists
    const existingAdmins = await db.select().from(users).where(users.email.equals('admin@packpal.com'));
    
    // Create admin user if it doesn't exist
    if (!existingAdmins.length) {
      // Hash the password
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
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Database initialization complete');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    return false;
  }
};

// Run the initialization function if this file is executed directly
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