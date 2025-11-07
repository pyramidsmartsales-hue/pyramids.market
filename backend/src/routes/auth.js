const express = require('express');
const router = express.Router();

// Placeholder auth routes (implement JWT + bcrypt)
router.post('/login', (req, res) => {
  // TODO: implement authentication
  res.status(501).json({ message: 'Not implemented. Create auth logic.' });
});

module.exports = router;
