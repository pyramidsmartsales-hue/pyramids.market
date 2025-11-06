require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
// initialize whatsapp service
try { require('./services/whatsappService').init(); } catch(e){ console.warn('WhatsApp service failed to init', e.message) }

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// simple health
app.get('/api/healthz', (req, res) => res.json({ok:true, name:'pyramids-mart-backend'}));

// connect to mongo
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async ()=>{ console.log('Mongo connected'); await ensureAdmin(); })
  .catch(err=>console.error('Mongo error', err));

// mount routers (skeleton)

// create initial admin user if ADMIN_EMAIL and ADMIN_PASSWORD are set
const User = require('./models/User');
const bcrypt = require('bcryptjs');
async function ensureAdmin(){
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPass) return;
  try {
    const exists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!exists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(adminPass, salt);
      const u = new User({ name: 'Owner', email: adminEmail.toLowerCase(), passwordHash: hash, role: 'owner' });
      await u.save();
      console.log('Created initial admin user:', adminEmail);
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Admin creation error', err);
  }
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
