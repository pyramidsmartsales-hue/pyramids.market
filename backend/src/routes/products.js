const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

/**
 * Helper: يحوّل أي قيمة رقمية بشكل آمن
 */
const num = (x, def = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
};

/**
 * Helper: يلتقط أول قيمة موجودة من مجموعة مفاتيح (يدعم مسارات متداخلة "a.b")
 */
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

/* =======================
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

/* =======================
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

/* =======================
 * PUT /api/products/:id   (اختياري: للتعديل من المودال)
 * ======================= */
router.put('/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

/* =======================
 * DELETE /api/products/:id (اختياري)
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

/* =========================================================================
 * POST /api/products/import/excel
 * يستقبل JSON بالشكل: { items: [ {name, barcode, salePrice|price|..., cost|..., quantity|qty|stock|... , ...}, ... ] }
 * لا يحتاج multipart — الواجهة الأمامية ترسل JSON بالفعل.
 * يحدّث/يُدرِج بالسجل اعتمادًا على barcode إن وُجد وإلا فالاسم.
 * ========================================================================= */
router.post('/import/excel', async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : null;
    if (!items) return res.status(400).json({ error: 'Body must be { items: [...] }' });

    let upserted = 0;
    const results = [];

    for (const raw of items) {
      // التعيين المرن للأسماء
      const name = String(pickFirst(raw, ['name', 'product', 'item', 'product name']) || '').trim();
      const barcode = String(
        pickFirst(raw, ['barcode', 'code', 'sku']) || ''
      ).trim();

      // قراءة الأرقام من عدة مسارات محتملة (تدعم الكائنات الفرعية)
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

      const expiry = pickFirst(raw, ['expiry', 'expiryDate', 'exp']) || null;
      const category = pickFirst(raw, ['category', 'cat']) || null;

      if (!name && !barcode) {
        // سطر غير صالح — لا اسم ولا باركود
        continue;
      }

      const where = barcode ? { barcode } : { name };
      const update = {
        name,
        barcode: barcode || undefined,
        salePrice,
        costPrice,
        quantity,
        expiry,
        category,
        updatedAt: new Date(),
      };

      const r = await Product.updateOne(
        where,
        { $set: update, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
      );

      if (r.upsertedCount || r.modifiedCount) upserted++;
      results.push({ where, ok: true });
    }

    res.json({ ok: true, upserted, count: items.length, results });
  } catch (e) {
    console.error('import/excel error:', e);
    res.status(500).json({ error: e.message });
  }
});

/* =========================================================================
 * POST /api/products/bulk-import   (الإصدار السابق لديك — أبقيناه كما هو)
 * يستقبل csv نصّي أو json array ويعمل upsert بالاسم.
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
        headers.forEach((h, i) => obj[h] = cols[i]);
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

      const update = {
        name,
        salePrice: num(r.salePrice ?? r.price),
        costPrice: num(r.costPrice ?? r.cost),
        quantity: num(r.quantity ?? r.qty),
        active: String(r.active ?? 'true').toLowerCase() !== 'false',
        totalSales: num(r.totalSales),
        updatedAt: new Date(),
      };

      const result = await Product.updateOne(
        { name }, // upsert بالاسم (يمكن تغييره للـ barcode)
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
