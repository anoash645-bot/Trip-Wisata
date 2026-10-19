'use strict';
const config = require('./src/config');
const { createApp } = require('./src/app');

const { server, store } = createApp();

server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ t: new Date().toISOString(), level: 'info', msg: `Server berjalan di ${config.siteUrl} (port ${config.port}, ${config.env})` }));
  if (!config.adminToken) console.warn(JSON.stringify({ level: 'warn', msg: 'ADMIN_TOKEN belum diatur: halaman /admin dinonaktifkan' }));
  if (config.isProd && /localhost/.test(config.siteUrl)) console.warn(JSON.stringify({ level: 'warn', msg: 'SITE_URL masih localhost. Atur SITE_URL ke domain asli agar canonical, sitemap, dan Open Graph benar.' }));
});

const shutdown = (sig) => {
  console.log(JSON.stringify({ level: 'info', msg: `${sig} diterima, menutup server` }));
  server.close(async () => { await store.flush(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => console.error(JSON.stringify({ level: 'error', msg: 'unhandledRejection', err: String(e) })));
