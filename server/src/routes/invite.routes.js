const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/invite.controller');

// Get invitation details by token
router.get('/:token', inviteController.getInviteByToken);

module.exports = router; 