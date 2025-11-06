const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const auth = require('../middlewares/auth');
const WhatsAppLog = require('../models/WhatsAppLog');
const Client = require('../models/Client');

// ensure service initialized
// NOTE: initialization is triggered from server.js after DB connects
// whatsappService.init();

// GET /api/whatsapp/qr -> returns dataURL of QR or null
router.get('/qr', async (req, res) => {
  try {
    const qr = await whatsappService.getQRCode();
    const status = whatsappService.getStatus();
    res.json({ qr, connected: status.connected });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get QR', error: err.message });
  }
});

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  const status = whatsappService.getStatus();
  res.json(status);
});

// POST /api/whatsapp/send -- protected
// body: { clientIds: [], text: '', attachments: [] }
router.post('/send', auth, async (req, res) => {
  try {
    const { clientIds = [], text = '', attachments = [] } = req.body;
    if (!Array.isArray(clientIds) || clientIds.length === 0) return res.status(400).json({ message: 'clientIds required' });

    // start bulk send with progress
    const results = [];
    await whatsappService.sendBulk(clientIds, text, attachments, (done, total) => {
      // optional: you could push progress to a websocket or SSE
      // console.log(`Progress: ${done}/${total}`);
    }).then(r => results.push(...r));

    res.json({ ok:true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Send failed', error: err.message });
  }
});

// GET /api/whatsapp/logs
router.get('/logs', auth, async (req, res) => {
  const logs = await WhatsAppLog.find().sort({createdAt:-1}).limit(500).populate('client','name phone');
  res.json(logs);
});

module.exports = router;