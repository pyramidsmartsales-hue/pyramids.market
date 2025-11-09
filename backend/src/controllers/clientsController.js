// backend/src/controllers/clientsController.js
const Client = require('../models/Client');

function parseTags(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v).split(/[|,]/).map(s => s.trim()).filter(Boolean);
}

// ==== Existing CRUD ====
async function listClients(req, res) {
  const { search, area, tag, page = 1, limit = 50 } = req.query;
  const query = {};
  if (search) query.name = { $regex: search, $options: 'i' };
  if (area) query.area = area;
  if (tag) query.tags = tag;
  const skip = (parseInt(page)-1) * parseInt(limit);
  const clients = await Client.find(query).sort({createdAt:-1}).skip(skip).limit(parseInt(limit));
  const total = await Client.countDocuments(query);
  res.json({ data: clients, total });
}

async function getClient(req, res) {
  const c = await Client.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Client not found' });
  res.json(c);
}

async function createClient(req, res) {
  const payload = req.body;
  try {
    const c = new Client(payload);
    await c.save();
    res.status(201).json(c);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid data', error: err.message });
  }
}

async function updateClient(req, res) {
  try {
    const c = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(c);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Update failed' });
  }
}

async function deleteClient(req, res) {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ ok:true });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
}

// ==== New: bulk upsert for Excel import ====
async function bulkUpsert(req, res) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.json({ matched: 0, upserted: 0 });

    const ops = [];
    for (const it of items) {
      const phone = String(it.phone || "").trim();
      const doc = {
        name: it.name || "",
        phone,
        area: it.area || "",
        notes: it.notes || "",
        tags: parseTags(it.tags),
        lastMessageAt: it.lastMessageAt ? new Date(it.lastMessageAt) : undefined,
        lastPurchaseAt: it.lastPurchaseAt ? new Date(it.lastPurchaseAt) : undefined,
      };
      if (!phone) continue;
      ops.push({
        updateOne: {
          filter: { phone },
          update: { $set: doc },
          upsert: true
        }
      });
    }
    if (!ops.length) return res.json({ matched: 0, upserted: 0 });

    const result = await Client.bulkWrite(ops, { ordered: false });
    res.json({
      matched: result.matchedCount ?? 0,
      modified: result.modifiedCount ?? 0,
      upserted: result.upsertedCount ?? 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'bulk upsert failed', error: e.message });
  }
}

module.exports = { listClients, getClient, createClient, updateClient, deleteClient, bulkUpsert };
