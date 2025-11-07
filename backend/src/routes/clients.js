const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Basic CRUD skeleton
router.get('/', async (req, res) => {
  const clients = await Client.find().limit(100);
  res.json(clients);
});

router.post('/', async (req, res) => {
  const c = new Client(req.body);
  await c.save();
  res.status(201).json(c);
});

module.exports = router;
