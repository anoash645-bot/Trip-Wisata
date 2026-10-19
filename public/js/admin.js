(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const KEY = 'togean-admin-token';
  let token = sessionStorage.getItem(KEY) || '';
  let statuses = [];

  const api = async (path, opts = {}) => {
    const res = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
    if (res.status === 401) { logout('Token salah atau kedaluwarsa.'); throw new Error('unauthorized'); }
    return res;
  };

  const el = (tag, props = {}, ...kids) => {
    const n = Object.assign(document.createElement(tag), props);
    kids.forEach((k) => n.append(k));
    return n;
  };

  function logout(msg = '') {
    token = ''; sessionStorage.removeItem(KEY);
    $('#login').hidden = false; $('#panel').hidden = true; $('#actions').hidden = true;
    $('#loginMsg').textContent = msg;
  }

  const fmtDate = (iso) => new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  function render(bookings) {
    const rows = $('#rows');
    rows.replaceChildren();
    $('#empty').hidden = bookings.length > 0;
    $('#summary').textContent = `${bookings.length} pesanan ditampilkan.`;
    for (const b of bookings) {
      const sel = el('select', { 'aria-label': `Status ${b.ref}` });
      statuses.forEach((s) => sel.append(el('option', { value: s, textContent: s, selected: s === b.status })));
      sel.addEventListener('change', async () => {
        sel.disabled = true;
        try {
          const r = await api(`/api/admin/bookings/${b.id}`, { method: 'PATCH', body: JSON.stringify({ status: sel.value }) });
          if (!r.ok) throw new Error();
        } catch { sel.value = b.status; alert('Gagal mengubah status.'); }
        sel.disabled = false;
        b.status = sel.value;
      });
      rows.append(el('tr', {},
        el('td', { className: 'ref', textContent: b.ref }),
        el('td', { textContent: fmtDate(b.createdAt) }),
        el('td', {}, b.nama, el('small', { textContent: `${b.tamu} orang${b.kontak ? ' · ' + b.kontak : ''}` })),
        el('td', { textContent: b.paketNama || b.paket }),
        el('td', { textContent: b.tanggal || '-' }),
        el('td', {}, b.berangkat, el('small', { textContent: `Pulang: ${b.pulang}` })),
        el('td', { className: 'note', textContent: b.catatan || '-' }),
        el('td', {}, sel),
      ));
    }
  }

  async function load() {
    const q = $('#filter').value;
    const res = await api(`/api/admin/bookings${q ? `?status=${encodeURIComponent(q)}` : ''}`);
    if (res.status === 503) return logout('ADMIN_TOKEN belum diatur di server.');
    const json = await res.json();
    if (!statuses.length) {
      statuses = json.statuses;
      const f = $('#filter');
      statuses.forEach((s) => f.append(el('option', { value: s, textContent: s })));
    }
    $('#login').hidden = true; $('#panel').hidden = false; $('#actions').hidden = false;
    render(json.bookings);
  }

  $('#login').addEventListener('submit', async (e) => {
    e.preventDefault();
    token = $('#token').value.trim();
    $('#loginMsg').textContent = '';
    try { sessionStorage.setItem(KEY, token); await load(); $('#token').value = ''; } catch { /* pesan sudah ditampilkan */ }
  });
  $('#refresh').addEventListener('click', () => load().catch(() => {}));
  $('#filter').addEventListener('change', () => load().catch(() => {}));
  $('#logout').addEventListener('click', () => logout());
  $('#csv').addEventListener('click', async () => {
    const res = await api('/api/admin/bookings.csv').catch(() => null);
    if (!res || !res.ok) return;
    const url = URL.createObjectURL(await res.blob());
    const a = el('a', { href: url, download: 'pesanan-togean.csv' });
    document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  if (token) load().catch(() => {});
})();
