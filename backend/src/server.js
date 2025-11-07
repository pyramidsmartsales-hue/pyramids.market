require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// simple health
app.get('/api/healthz', (req, res) => res.json({ok:true, name:'pyramids-mart-backend'}));

// connect to mongo
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('Mongo connected'))
  .catch(err=>console.error('Mongo error', err));

// mount routers (skeleton)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/whatsapp', require('./routes/whatsapp'));

const PORT = process.env.PORT || 5000;
// Serve the built frontend from the Express server when in production.
// This allows deploying a single Node server on Render/Heroku that serves
// both the API (under /api) and the static dashboard (under /). If you
// deploy the frontend separately, this block has no effect.
const frontendPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// For any request that doesn't match an API route, send back the
// frontend's index.html. This enables client‑side routing to work
// correctly when the user refreshes the page or visits a nested
// route directly.
app.get('*', (req, res) => {
  // Skip requests that start with /api or already have a file
  if (req.path.startsWith('/api')) {
    return res.status(404).end();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
