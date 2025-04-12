const express = require('express');
const router = express.Router();

router.get('/ping', (req, res) => {
  res.json({ message: 'Server is up and running!' });
});

module.exports = router; 