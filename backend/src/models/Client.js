// backend/src/models/Client.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  area: String,
  notes: String,
  tags: [{ type: String, enum: ['Active', 'Inactive', 'VIP'] }],
  lastMessageAt: Date,
  lastPurchaseAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Client', ClientSchema);
