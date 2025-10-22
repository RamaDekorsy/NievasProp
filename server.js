require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

let mongoose = null;
try { mongoose = require('mongoose'); } catch {}

const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

if (process.env.MONGODB_URI && mongoose) {
  mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB || undefined })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err.message));
}

const PUBLIC_DIR = path.join(__dirname, 'public');
console.log('[BOOT] PUBLIC_DIR:', PUBLIC_DIR, 'exists:', fs.existsSync(PUBLIC_DIR));
console.log('[BOOT] INDEX exists:', fs.existsSync(path.join(PUBLIC_DIR, 'index.html')));

// API first
try {
  const api = require('./backend/api');
  app.use('/api', api);
} catch (e) {
  console.warn('[BOOT] API router not loaded:', e?.message);
}

// Static
app.use(express.static(PUBLIC_DIR, { index: 'index.html', extensions: ['html','htm'] }));

// Health
app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Root
app.get('/', (_req, res) => res.sendFile('index.html', { root: PUBLIC_DIR }));

// Fallback
app.use((req, res) => res.sendFile('index.html', { root: PUBLIC_DIR }));

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => console.log(`[BOOT] Server listening on http://${HOST}:${PORT}`));
module.exports = app;
