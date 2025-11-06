/**
 * whatsappService - singleton wrapper around whatsapp-web.js Client
 * Uses LocalAuth if available (preferred). Stores QR as latest QR string.
 * Exposes:
 *  - init()
 *  - getStatus()
 *  - getQRCode() -> dataURL or null
 *  - sendMessage(phone, text, attachments)
 *  - sendBulk(clientsArray, text, attachments, progressCallback)
 *
 * Note: This service depends on `whatsapp-web.js` and `qrcode`.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const WhatsAppLog = require('../models/WhatsAppLog');
const ClientModel = require('../models/Client');

let clientInstance = null;
let latestQR = null;
let connected = false;

function init() {
  if (clientInstance) return clientInstance;

  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: process.env.WHATSAPP_SESSION_PATH || './whatsapp-session'
    }),
    puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
  });

  client.on('qr', async (qr) => {
    latestQR = qr;
    try {
      const dataUrl = await qrcode.toDataURL(qr);
      latestQR = dataUrl;
    } catch (err) {
      console.warn('QR to dataURL failed', err.message);
    }
    console.log('WhatsApp QR received');
  });

  client.on('ready', () => {
    connected = true;
    console.log('WhatsApp client ready');
  });

  client.on('authenticated', () => {
    connected = true;
    console.log('WhatsApp authenticated');
  });

  client.on('auth_failure', msg => {
    connected = false;
    console.error('WhatsApp auth failure', msg);
  });

  client.on('disconnected', (reason) => {
    connected = false;
    console.log('WhatsApp disconnected', reason);
    // try to reinitialize after a short delay
    setTimeout(()=>{ try { client.initialize(); } catch(e){ console.warn('reinit failed', e.message) } }, 3000);
  });

  client.initialize().catch(err => console.error('WhatsApp init error', err));
  clientInstance = client;
  return client;
}

function getStatus() {
  return { connected, hasQR: !!latestQR };
}

async function getQRCode() {
  return latestQR; // dataURL or null
}

async function sendMessage(phone, text, attachments=[]) {
  if (!clientInstance) init();
  // Normalize phone to include country code digits only
  const normalized = phone.replace(/\D/g,'');
  const id = normalized + "@c.us";
  try {
    // log pending
    const log = new WhatsAppLog({ phone: normalized, messageText: text, attachments, status:'pending' });
    await log.save();
    // send message
    if (attachments && attachments.length) {
      // for simplicity assume attachments are URLs - send as media messages
      const { MessageMedia } = require('whatsapp-web.js');
      for (const url of attachments) {
        try {
          const media = await MessageMedia.fromUrl(url);
          await clientInstance.sendMessage(id, media, { caption: text });
        } catch (err) {
          console.warn('media send failed', err.message);
        }
      }
    } else {
      await clientInstance.sendMessage(id, text);
    }
    log.status = 'sent';
    log.sentAt = new Date();
    await log.save();
    return { ok:true };
  } catch (err) {
    console.error('sendMessage error', err);
    const log = new WhatsAppLog({ phone: phone, messageText: text, attachments, status:'failed' });
    await log.save();
    return { ok:false, error: err.message };
  }
}

async function sendBulk(clientIds = [], text='', attachments = [], progressCb = null) {
  if (!clientInstance) init();
  const results = [];
  for (let i = 0; i < clientIds.length; i++) {
    const clientId = clientIds[i];
    try {
      const client = await ClientModel.findById(clientId);
      if (!client) {
        results.push({ clientId, ok:false, error:'Client not found' });
        if (progressCb) progressCb(i+1, clientIds.length);
        continue;
      }
      const res = await sendMessage(client.phone, text, attachments);
      results.push({ clientId, phone: client.phone, res });
    } catch (err) {
      results.push({ clientId, ok:false, error: err.message });
    }
    if (progressCb) progressCb(i+1, clientIds.length);
    // small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

module.exports = { init, getStatus, getQRCode, sendMessage, sendBulk };
