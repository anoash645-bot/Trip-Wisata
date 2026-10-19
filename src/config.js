'use strict';
const path = require('node:path');

const bool = (v, d = false) => (v === undefined || v === '' ? d : /^(1|true|yes|on)$/i.test(String(v)));

const root = path.join(__dirname, '..');

const config = {
  root,
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  // URL publik tanpa garis miring di akhir, mis. https://wulmufikra.com
  siteUrl: (process.env.SITE_URL || `http://localhost:${Number(process.env.PORT) || 3000}`).replace(/\/+$/, ''),
  publicDir: path.join(root, 'public'),
  dataDir: process.env.DATA_DIR || path.join(root, 'data'),
  adminToken: process.env.ADMIN_TOKEN || '',
  // 'file' (default) atau 'firestore' (disarankan di Cloud Run / App Engine)
  storage: (process.env.STORAGE || 'file').toLowerCase(),
  trustProxy: bool(process.env.TRUST_PROXY, true),
  forceHttps: bool(process.env.FORCE_HTTPS, false),
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  webhookUrl: process.env.WEBHOOK_URL || '',
  gaId: /^G-[A-Z0-9]+$/i.test(process.env.GA_ID || '') ? process.env.GA_ID : '',
  gscVerification: process.env.GSC_VERIFICATION || '',
};

config.isProd = config.env === 'production';
module.exports = config;
