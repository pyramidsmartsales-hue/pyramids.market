const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/** ===== Helpers ===== */
const num = (x, def = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
};

const getPath = (obj, path) => {
  if (!obj) return undefined;
  if (path.includes('.')) {
    return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
  }
  return obj[path];
};

const pickFirst = (obj, keys, def = undefined) => {
  for (const k of keys) {
    const v = getPath(obj, k);
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return def;
};

// حقول مسموح بتحديثها حسب المخطط الشائع لدينا
const ALLOWED_FIELDS = new Set([
  'name',
  'salePrice',
  'costPrice',
  'quantity',
  'expiry',
  'category',
  'active',
  'totalSales',
]);

/** =======================
 * GET /api/products
 * ======================= */
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ updatedAt: -1 }).lean();
    res.json(products);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** =======================
 * POST /api/products
 * ======================= */
router.post('/', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json(p);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** =======================
 * PUT /api/products/:id
 * ======================= */
router.put('/:id', async (req, res) => {
  try {
    // فلترة الحقول طبقًا للمسموح
    const body = {};
    for (const k of Object.keys(req.body || {})) {
      if (ALLOWED_FIELDS.has(k)) body[k] = req.body[k];
    }
    const updated = await Product.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** =======================
 * DELETE /api/products/:id
 * ======================= */
router.delete('/:id', async (req, res) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id).lean();
    if (!del) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/** =========================================================================
 * POST /api/products/import/excel
 * يستقبل: { items: [ { Name/Barcode/Sale Price/Cost/Quantity/... } ] }
 * - لا يضع barcode داخل $set حتى لا يصطدم بالمخطط.
 * - upsert بالاسم فقط.
 * ========================================================================= */
router.post('/import/excel', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : null;
    if (!items) return res.status(400).json({ error: 'Body must be { items: [...] }' });

    let upserted = 0;
    const results = [];

    for (const raw of items) {
      const name = String(pickFirst(raw, ['name', 'product', 'item', 'product name']) || '').trim();
      // نبقي قراءة الباركود فقط لو تحب تستخدمه لاحقًا – لكن لا نضعه في $set
      // const barcode = String(pickFirst(raw, ['barcode', 'code', 'sku']) || '').trim();

      const salePrice = num(
        pickFirst(raw, ['salePrice', 'price', 'sellingPrice', 'unitPrice', 'pricing.sale', 'price.sale']),
        0
      );
      const costPrice = num(
        pickFirst(raw, ['cost', 'costPrice', 'purchasePrice', 'buyPrice', 'pricing.cost', 'price.cost']),
        0
      );
      const quantity = num(
        pickFirst(raw, ['quantity', 'qty', 'stock', 'inventory.qty', 'inventory.quantity']),
        0
      );
      const expiry   = pickFirst(raw, ['expiry', 'expiryDate', 'expire', 'exp']) || null;
      const category = pickFirst(raw, ['category', 'cat']) || null;

      if (!name) {
        // لا اسم => نتجاهل السطر
        results.push({ ok: false, reason: 'missing name' });
        continue;
      }

      // نبني الـ update مع فلترة للمسموح فقط
      const update = {};
      const candidate = {
        name,
        salePrice,
        costPrice,
        quantity,
        expiry,
        category,
        updatedAt: new Date(),
      };
      for (const k of Object.keys(candidate)) {
        if (candidate[k] !== undefined && ALLOWED_FIELDS.has(k)) update[k] = candidate[k];
      }

      const r = await Product.updateOne(
        { name }, // upsert بالاسم فقط
        { $set: update, $setOnInsert: { createdAt: new Date() } },
        { upsert: true } // لا نغير strict => الافتراضي آمن الآن لأننا لا نرسل حقول غريبة
      );

      if (r.upsertedCount || r.modifiedCount) upserted++;
      results.push({ where: { name }, ok: true });
    }

    res.json({ ok: true, upserted, count: items.length, results });
  } catch (e) {
    console.error('import/excel error:', e);
    res.status(500).json({ error: e.message });
  }
});

/** =========================================================================
 * POST /api/products/bulk-import  (أبقيناه كما هو تقريبًا مع فلترة عامّة)
 * ========================================================================= */
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
        headers.forEach((h, i) => (obj[h] = cols[i]));
        return obj;
      });
    } else if (Array.isArray(json)) {
      rows = json;
    } else {
      return res.status(400).json({ error: 'Provide csv (string) or json (array).' });
    }

    let upserted = 0;
    for (const r of rows) {
      const name = (r.name || '').trim();
      if (!name) continue;

      const candidate = {
        name,
        salePrice: num(r.salePrice ?? r.price),
        costPrice: num(r.costPrice ?? r.cost),
        quantity:  num(r.quantity ?? r.qty),
        active: String(r.active ?? 'true').toLowerCase() !== 'false',
        totalSales: num(r.totalSales),
        updatedAt: new Date(),
      };

      const update = {};
      for (const k of Object.keys(candidate)) {
        if (candidate[k] !== undefined && ALLOWED_FIELDS.has(k)) update[k] = candidate[k];
      }

      const result = await Product.updateOne(
        { name },
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
