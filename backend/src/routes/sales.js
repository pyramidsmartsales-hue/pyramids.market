// backend/src/routes/sales.js
const router = require('express').Router();
const Sale = require('../models/Sale');
const Client = require('../models/Client');
const axios = require('axios');
const csvtojson = require('csvtojson');

// ---------- Helpers ----------
const canon = s => String(s || '').toLowerCase().trim();
const num = (x, def = 0) => {
  const n = Number(String(x ?? '').replace(/[, ]/g, ''));
  return Number.isFinite(n) ? n : def;
};
// تاريخ فقط (UTC: 00:00)
const toDateOnly = v => {
  if (!v) return null;
  let s = String(v).trim();
  // دعم dd/mm/yyyy
  const p = s.split('/');
  let d;
  if (p.length === 3) {
    const [dd, mm, yy] = p;
    d = new Date(`${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`);
  } else {
    d = new Date(s);
  }
  if (isNaN(d?.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};
const makeKey = (inv, clientName, dateOnly, total) =>
  (inv || '') || `${canon(clientName)}|${dateOnly?.toISOString()?.slice(0, 10) || ''}|${num(total, 0)}`;

// ---------- List (paged, q) ----------
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '20', 10)));
    const q = String(req.query.q || '').trim();
