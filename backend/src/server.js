// ===== تحميل ملف البيئة .env =====
import 'dotenv/config';

// ===== المكتبات الأساسية =====
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

// ===== إصلاح __dirname في ESM =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إنشاء التطبيق
const app = express();
app.use(helmet());

// ===== CORS (مرن ويغطي نفس الدومين + الموقع القديم واللوكال) =====
const defaultAllow =
  'https://pyramids-market.onrender.com,https://pyramids-market-site.onrender.com,http://localhost:5173';

const allowlist = (process.env.CORS_ALLOWLIST || defaultAllow)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowlist.includes(origin)) return cb(null, true);
    if (/\.onrender\.com$/.test(new URL(origin).hostname)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============ JSON ============
app.use(express.json());

// ============ Health ============
app.get('/api/healthz', (req, res) =>
  res.json({ status: 'ok', name: 'pyramids-mart-backend' })
);

// ============ Routers ============
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/clients', (await import('./routes/clients.js')).default);
app.use('/api/products', (await import('./routes/products.js')).default);
app.use('/api/expenses', (await import('./routes/expenses.js')).default);
app.use('/api/sales', (await import('./routes/sales.js')).default);
app.use('/api/whatsapp', (await import('./routes/whatsapp.js')).default);
app.use('/api/uploads', (await import('./routes/uploads.js')).default);
app.use('/api/stats', (await import('./routes/stats.js')).default);
app.use('/api/pos', (await import('./routes/pos.js')).default);
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ============ تقديم واجهة Vite ============
const distDir = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

// ============ MongoDB ============
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose.connect(MONGO)
  .then(() => {
    console.log('Mongo connected');
    ensureAdmin().catch(e =>
      console.error('ensureAdmin failed:', e.message || e)
    );
  })
  .catch(err => console.error('Mongo connection error:', err.message || err));

// ============ Bootstrap Admin ============
async function ensureAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  console.log('ENV check -> ADMIN_EMAIL:', !!ADMIN_EMAIL, 'ADMIN_PASSWORD:', !!ADMIN_PASSWORD);
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not provided — skipping admin bootstrap.');
    return;
  }
  try {
    const exists = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!exists) {
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await new User({
        name: 'Owner',
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash: hash,
        role: 'owner',
      }).save();
      console.log('Created initial admin user:', ADMIN_EMAIL);
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Admin creation error', err.message || err);
  }
}

// ============ Start ============
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, () => {
  console.log(`Server started and listening on port ${PORT}`);
  console.log('NODE_ENV=', process.env.NODE_ENV || 'development');

  setTimeout(async () => {
    try {
      const whatsappService = (await import('./services/whatsappService.js')).default;
      await whatsappService.start();
      console.log('WhatsApp start attempted.');
    } catch (err) {
      console.error('WhatsApp start error:', err.message || err);
    }
  }, 2000);
});
