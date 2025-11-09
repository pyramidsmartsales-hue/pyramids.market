const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// List products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 }).lean();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Bulk import (CSV raw text OR JSON array)
router.post('/bulk-import', async (req, res) => {
  try {
    let rows = [];
    const { csv, json } = req.body || {};

    if (csv && typeof csv === 'string') {
      const lines = csv.trim().split(/\r?\n/);
      if (!lines.length) return res.json({ ok: true, upserted: 0 });
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
      rows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
        const obj = {};
        headers.forEach((h, i) => obj[h] = cols[i]);
        return obj;
      });
    } else if (Array.isArray(json)) {
      rows = json;
    } else {
      return res.status(400).json({ error: 'Provide csv (string) or json (array).' });
    }

    const num = (x) => {
      const n = Number(x);
      return Number.isFinite(n) ? n : 0;
    };

    let upserted = 0;
    for (const r of rows) {
      const name = (r.name || '').trim();
      if (!name) continue;

      const update = {
        name,
        salePrice: num(r.salePrice ?? r.price),
        costPrice: num(r.costPrice ?? r.cost),
        quantity: num(r.quantity ?? r.qty),
        active: String(r.active ?? 'true').toLowerCase() !== 'false',
        totalSales: num(r.totalSales),
      };
      if (r.updatedAt) update.updatedAt = new Date(r.updatedAt);

      const result = await Product.updateOne(
        { name }, // upsert by name (يمكن تغييره لـ sku إذا أردت)
        { $set: update, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );
      if (result.upsertedCount || result.modifiedCount) upserted++;
    }

    res.json({ ok: true, upserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
