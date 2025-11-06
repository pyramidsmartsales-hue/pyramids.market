const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

router.get('/', async (req, res) => {
  const items = await Expense.find().sort({date:-1}).limit(200);
  res.json(items);
});

router.post('/', async (req, res) => {
  const e = new Expense(req.body);
  await e.save();
  res.status(201).json(e);
});

module.exports = router;
