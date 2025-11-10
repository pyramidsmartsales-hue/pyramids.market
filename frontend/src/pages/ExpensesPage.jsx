// backend/src/routes/expenses.js
const express = require('express');
const router = express.Router();
const { readRows, appendRow, updateRow, deleteRow } = require('../google/sheets.repo');

const SHEET_ID = process.env.SHEET_EXPENSES_ID;
const TAB = process.env.SHEET_EXPENSES_TAB || 'Expenses';
// Columns: A:Date(ISO) | B:Description | C:Amount | D:Category | E:Notes

// ────────────────────────────────────────────────────────────
// Date normalization:
// - Google/Excel serial (e.g., 45991)  -> "YYYY-MM-DD"
// - "DD-MM-YYYY" (e.g., 30-11-2025)    -> "YYYY-MM-DD"
// - ISO "YYYY-MM-DD" is returned as-is
function normalizeDate(v) {
  if (v == null) return '';

  // Excel serial number (number or numeric string)
  const asNum = Number(v);
  if (!Number.isNaN(asNum) && String(v).trim() !== '' && /^[0-9]+(\.[0-9]+)?$/.test(String(v))) {
    // 25569 days between 1899-12-30 and 1970-01-01
    const ms = Math.round((asNum - 25569) * 86400 * 1000);
    return new Date(ms).toISOString().slice(0, 10); // "YYYY-MM-DD"
  }

  const s = String(v).trim();

  // "DD-MM-YYYY"
  const m = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;

  // ISO "YYYY-MM-DD" or others: take first 10 chars safely
  return s.slice(0, 10);
}

function rowToExpense(r) {
  return {
    date: normalizeDate(r[0]),
    description: r[1] || '',
    amount: Number(r[2] || 0),
    category: r[3] || '',
    notes: r[4] || '',
  };
}

router.get('/', async (req, res) => {
  try {
    const rows = await readRows(SHEET_ID, TAB, 'A2:E');
    const list = rows.map(rowToExpense);
    res.json(list);
  } catch (e) {
    console.error('GET expenses:', e?.message || e);
    res.status(500).json({ error: 'Failed to read expenses' });
  }
});

router.post('/google', async (req, res) => {
  try {
    let { date, description, amount = 0, category = '', notes = '' } = req.body || {};
    const iso = normalizeDate(date);
    if (!iso || !description) return res.status(400).json({ error: 'date and description are required' });

    await appendRow(SHEET_ID, TAB, [iso, description, Number(amount), category, notes]);
    res.json({ ok: true });
  } catch (e) {
    console.error('POST expense:', e?.message || e);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// update by composite key (date+description) using ISO date in URL
router.put('/google/:date/:desc', async (req, res) => {
  try {
    const keyDate = normalizeDate(req.params.date);
    const keyDesc = req.params.desc;

    const rows = await readRows(SHEET_ID, TAB, 'A2:E');
    const idx = rows.findIndex(r => normalizeDate(r[0]) === keyDate && String(r[1] || '') === String(keyDesc));
    const rowIdx1 = idx >= 0 ? idx + 2 : -1;
    if (rowIdx1 < 0) return res.status(404).json({ error: 'Expense not found' });

    let { date = keyDate, description = keyDesc, amount = 0, category = '', notes = '' } = req.body || {};
    const iso = normalizeDate(date);
    await updateRow(SHEET_ID, TAB, rowIdx1, [iso, description, Number(amount), category, notes]);
    res.json({ ok: true });
  } catch (e) {
    console.error('PUT expense:', e?.message || e);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/google/:date/:desc', async (req, res) => {
  try {
    const keyDate = normalizeDate(req.params.date);
    const keyDesc = req.params.desc;

    const rows = await readRows(SHEET_ID, TAB, 'A2:E');
    const idx = rows.findIndex(r => normalizeDate(r[0]) === keyDate && String(r[1] || '') === String(keyDesc));
    const rowIdx1 = idx >= 0 ? idx + 2 : -1;
    if (rowIdx1 < 0) return res.status(404).json({ error: 'Expense not found' });

    await deleteRow(SHEET_ID, TAB, rowIdx1);
    res.json({ ok: true });
  } catch (e) {
    console.error('DELETE expense:', e?.message || e);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
