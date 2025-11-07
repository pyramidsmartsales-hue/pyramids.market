const express = require('express');
const router = express.Router();

// Skeleton for whatsapp routes
router.get('/qr', (req, res) => {
  res.json({ qr: null, connected: false, message: 'QR endpoint not yet implemented' });
});

router.get('/status', (req, res) => {
  res.json({ connected: false });
});

router.post('/send', (req, res) => {
  // expect { clientIds: [], text, attachments: [] }
  res.status(501).json({ message: 'WhatsApp send not implemented in scaffold' });
});

module.exports = router;
