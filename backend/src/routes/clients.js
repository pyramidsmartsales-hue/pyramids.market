// backend/src/routes/clients.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const upload = multer({ dest: 'uploads/' });

const Client = require('../models/Client');
const { listClients, createClient, updateClient, deleteClient, bulkUpsert } = require('../controllers/clientsController');

router.get('/', listClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

// Excel: file upload
router.post('/import/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filePath = path.resolve(req.file.path);
    const wb = XLSX.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    const items = rows.map(r => ({
      name: r.name || r.Name || "",
      phone: r.phone || r.Phone || "",
      countryCode: String(r.countryCode || r.CountryCode || r.CC || "").replace(/[^0-9]/g, ""),
      area: r.area || r.Area || "",
      notes: r.notes || r.Notes || "",
      tags: r.tags || r.Tags || "",
      lastMessageAt: r.lastMessageAt || r['Last Message At'] || "",
      lastPurchaseAt: r.lastPurchaseAt || r['Last Purchase At'] || "",
    }));

    req.body.items = items;
    await bulkUpsert(req, res);
    fs.unlink(filePath, () => {});
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Excel import failed', error: e.message });
  }
});

// Excel: export
router.get('/export/excel', async (req, res) => {
  try {
    const clients = await Client.find().lean().limit(50000);
    const header = ['name','phone','countryCode','area','notes','tags','lastMessageAt','lastPurchaseAt'];
    const data = [header];
    for (const c of clients) {
      data.push([
        c.name || '',
        c.phone || '',
        c.countryCode || '',
        c.area || '',
        c.notes || '',
        (c.tags || []).join('|'),
        c.lastMessageAt ? new Date(c.lastMessageAt).toISOString().slice(0,10) : '',
        c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toISOString().slice(0,10) : '',
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Excel export failed' });
  }
});

// JSON bulk upsert (used by frontend)
router.post('/bulk-upsert', bulkUpsert);

module.exports = router;
