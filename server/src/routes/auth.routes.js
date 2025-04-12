const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Health check route
router.get('/health', authController.healthCheck);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/accept-invite/:token', authController.acceptInvite);

// Protected routes (requires authentication)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/password', authenticate, authController.updatePassword);

module.exports = router; 