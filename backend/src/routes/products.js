const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// List products
router.get('/', async (req, res) => {
  const products = await Product.find().limit(200);
  res.json(products);
});

router.post('/', async (req, res) => {
  const p = new Product(req.body);
  await p.save();
  res.status(201).json(p);
});

module.exports = router;
