const { db } = require('../db');
const { users } = require('../db/schema');
const { eq } = require('drizzle-orm');
const bcrypt = require('bcryptjs');

class UserRepository {
  /**
   * Find a user by ID
   * @param {string} id - UUID of the user
   * @returns {Promise<Object|null>} User object or null
   */
  async findById(id) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Find a user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User object or null
   */
  async findByEmail(email) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result.length > 0 ? result[0] : null;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data (firstName, lastName, email, password, role)
   * @returns {Promise<Object>} Created user object
   */
  async create(userData) {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Insert user with hashed password
    const result = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
      lastLogin: new Date()
    }).returning();

    return result[0];
  }

  /**
   * Update a user
   * @param {string} id - UUID of the user
   * @param {Object} userData - Updated user data
   * @returns {Promise<Object|null>} Updated user object or null
   */
  async update(id, userData) {
    // Check if password is being updated
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    // Update the user
    const result = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Delete a user
   * @param {string} id - UUID of the user
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  /**
   * Compare password with stored hash
   * @param {string} candidatePassword - Password to check
   * @param {string} storedPassword - Stored hashed password
   * @returns {Promise<boolean>} Match status
   */
  async comparePassword(candidatePassword, storedPassword) {
    return await bcrypt.compare(candidatePassword, storedPassword);
  }
}

module.exports = new UserRepository(); 