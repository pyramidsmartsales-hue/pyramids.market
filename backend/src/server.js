// ===== تحميل ملف البيئة .env =====
require('dotenv').config();

// ===== المكتبات الأساسية =====
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');

// إنشاء التطبيق
const app = express();
app.use(helmet());

// ===== CORS (مرن ويغطي نفس الدومين + الموقع القديم واللوكال) =====
/*
  لتعديل القائمة بدون تغيير الكود:
  CORS_ALLOWLIST=https://pyramids-market.onrender.com,https://pyramids-market-site.onrender.com,http://localhost:5173
*/
const defaultAllow =
  'https://pyramids-market.onrender.com,https://pyramids-market-site.onrender.com,http://localhost:5173';

const allowlist = (process.env.CORS_ALLOWLIST || defaultAllow)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// اجعل الاستجابة حساسة للاختلاف في Origin
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

const corsOptions = {
  origin(origin, cb) {
    // اسمح بطلبات بدون Origin (healthchecks، نفس-الأصل أحيانًا)
    if (!origin) return cb(null, true);
    try {
      const hostname = new URL(origin).hostname;
      if (allowlist.includes(origin)) return cb(null, true);
      // اسمح بدومينات onrender الخاصة بنا (احتياطي)
      if (/\.onrender\.com$/.test(hostname)) return cb(null, true);
    } catch (e) {}
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
// دعم preflight
app.options('*', cors(corsOptions));

// ============ JSON ============
app.use(express.json());

// ============ Health ============
app.get('/api/healthz', (req, res) =>
  res.json({ status: 'ok', name: 'pyramids-mart-backend' })
);

// ============ API Routers ============
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/products', require('./routes/products'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/pos', require('./routes/pos'));

// ملفات الـuploads العامة (لو لزم الأمر)
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ============ تقديم واجهة Vite (Static + SPA fallback) ============
// __dirname يشير إلى backend/src لذلك dist في ../../frontend/dist
const distDir = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distDir));

// أي مسار لا يبدأ بـ /api يرجّع index.html (تطبيق SPA)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'));
});

// ============ أخطاء غير ملتقطة ============
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION ➜', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('UNHANDLED REJECTION at Promise', p, 'reason:', reason);
});

// ============ MongoDB ============
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/pyramidsmart';
mongoose
  .connect(MONGO) // لا نستخدم خيارات قديمة
  .then(() => {
    console.log('Mongo connected');
    ensureAdmin().catch((e) =>
      console.error('ensureAdmin failed:', e && e.message ? e.message : e)
    );
  })
  .catch((err) => {
    console.error('Mongo connection error:', err && err.message ? err.message : err);
  });

// ============ Bootstrap Admin ============
const User = require('./models/User');
async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;
  console.log(
    'ENV check -> ADMIN_EMAIL:',
    !!adminEmail,
    'ADMIN_PASSWORD:',
    !!adminPass
  );
  if (!adminEmail || !adminPass) {
    console.log('ADMIN_EMAIL or ADMIN_PASSWORD not provided — skipping admin bootstrap.');
    return;
  }
  try {
    const exists = await User.findOne({ email: adminEmail.toLowerCase() });
    if (!exists) {
      const hash = await bcrypt.hash(adminPass, 10);
      await new User({
        name: 'Owner',
        email: adminEmail.toLowerCase(),
        passwordHash: hash,
        role: 'owner',
      }).save();
      console.log('Created initial admin user:', adminEmail);
    } else {
      console.log('Admin user already exists.');
    }
  } catch (err) {
    console.error('Admin creation error', err && err.message ? err.message : err);
  }
}

// ============ Start ============
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
app.listen(PORT, () => {
  console.log(`Server started and listening on port ${PORT}`);
  console.log('NODE_ENV=', process.env.NODE_ENV || 'development');

  // تشغيل خدمة الواتساب بعد إقلاع السيرفر
  setTimeout(async () => {
    try {
      const whatsappService = require('./services/whatsappService');
      if (whatsappService && typeof whatsappService.start === 'function') {
        await whatsappService.start();
      }
      console.log('WhatsApp start attempted.');
    } catch (err) {
      console.error('WhatsApp start error:', err && err.message ? err.message : err);
    }
  }, 2000);
});
