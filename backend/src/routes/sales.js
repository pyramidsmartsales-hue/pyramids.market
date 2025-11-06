const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

router.post('/', async (req, res) => {
  const s = new Sale(req.body);
  await s.save();
  res.status(201).json(s);
});

module.exports = router;
