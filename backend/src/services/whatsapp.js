// backend/src/services/whatsapp.js
const QRCode = require('qrcode');
const axios = require('axios');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

let sock = null;
let qrString = null;
let connected = false;
let initPromise = null;

// أين نخزّن الجلسة (يفضل مجلد دائم إن وفرته على Render)
const SESSION_DIR = process.env.WHATSAPP_SESSION_PATH || require('path').join(__dirname, '../../..', 'whatsapp-session');

async function start() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();
    sock = makeWASocket({ version, auth: state, printQRInTerminal: false });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({ connection, qr }) => {
      if (qr) { qrString = qr; connected = false; }
      if (connection === 'open') { connected = true; qrString = null; }
      if (connection === 'close') { connected = false; qrString = null; setTimeout(() => start(), 3000); }
    });
  })();
  return initPromise;
}

async function getStatus() {
  await start();
  return { connected, hasQR: !!qrString };
}

async function getQrDataUrl() {
  await start();
  if (!qrString) return null;
  return await QRCode.toDataURL(qrString);
}

async function sendBulk({ to = [], message, mediaUrl }) {
  await start();
  if (!connected) throw new Error('WhatsApp not connected');
  if (!Array.isArray(to) || to.length === 0) throw new Error('to must be an array');

  const results = [];
  for (const raw of to) {
    const phone = String(raw).replace(/\s+/g, '').replace(/^\+/, '');
    const jid = `${phone}@s.whatsapp.net`;
    try {
      if (mediaUrl) {
        const { data } = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        await sock.sendMessage(jid, { image: Buffer.from(data), caption: message || '' });
      } else {
        await sock.sendMessage(jid, { text: message });
      }
      results.push({ to: raw, ok: true });
    } catch (e) {
      results.push({ to: raw, ok: false, error: String(e) });
    }
  }
  return results;
}

module.exports = { start, getStatus, getQrDataUrl, sendBulk };
