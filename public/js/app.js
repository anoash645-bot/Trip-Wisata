(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = (n) => 'Rp ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  /* ---------- menu mobile ---------- */
  const toggle = $('#menuToggle');
  const menu = $('#menu');
  if (toggle && menu) {
    const set = (open) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    };
    toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    matchMedia('(min-width:861px)').addEventListener('change', () => set(false));
  }

  /* ---------- formulir pemesanan ---------- */
  const form = $('#bookingForm');
  if (form) {
    const f = {
      nama: $('#fNama'), paket: $('#fPaket'), tamu: $('#fTamu'), tgl: $('#fTgl'),
      berangkat: $('#fBerangkat'), pulang: $('#fPulang'), kontak: $('#fKontak'), catatan: $('#fCatatan'), web: $('#fWebsite'),
    };
    const est = $('#est'), err = $('#err'), status = $('#formStatus'), btn = $('#sendWa');
    const WA = form.dataset.wa;
    const selected = () => f.paket.selectedOptions[0];

    // Isi dari tautan, mis. /?paket=walea#pesan
    const want = new URLSearchParams(location.search).get('paket');
    if (want && [...f.paket.options].some((o) => o.value === want)) f.paket.value = want;

    const today = new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10); // WITA
    f.tgl.min = today;

    function updateEst() {
      const o = selected();
      const n = parseInt(f.tamu.value, 10) || 0;
      let note = 'Harga di atas untuk 2 orang.';
      if (n && n !== 2) note = `Harga di atas untuk 2 orang. Untuk ${n} tamu, admin kami akan mengonfirmasi tarifnya.`;
      est.innerHTML = `Harga paket<b>${fmt(+o.dataset.price)}</b>${note}`;
    }
    form.addEventListener('input', updateEst);
    updateEst();

    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const makeRef = () => 'WTG-' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => alphabet[b % alphabet.length]).join('');

    const collect = () => ({
      nama: f.nama.value.trim(), paket: f.paket.value, tamu: parseInt(f.tamu.value, 10),
      tanggal: f.tgl.value, berangkat: f.berangkat.value, pulang: f.pulang.value,
      kontak: f.kontak.value.trim(), catatan: f.catatan.value.trim(), website: f.web.value,
    });

    const waLink = (d, ref) => {
      const o = selected();
      const text = [
        'Halo Wulmufikra Togean Islands, saya ingin memesan paket wisata.', '',
        `Kode pesanan: ${ref}`,
        `Paket: ${o.dataset.name} (${o.dataset.days} hari)`,
        `Nama: ${d.nama || '-'}`,
        `Jumlah tamu: ${d.tamu || '-'}`,
        `Perkiraan berangkat: ${d.tanggal || '-'}`,
        `Jalur berangkat: ${d.berangkat}`,
        `Jalur pulang: ${d.pulang}`,
        d.kontak ? `Kontak: ${d.kontak}` : null,
        `Catatan: ${d.catatan || '-'}`,
      ].filter((x) => x !== null).join('\n');
      return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
    };

    const fail = (msg, el) => {
      err.textContent = msg;
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
      return false;
    };
    const clearErrors = () => {
      err.textContent = '';
      form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      status.textContent = ''; status.className = 'form-status';
      const d = collect();

      if (d.nama.length < 2) return fail('Isi nama Anda dulu supaya kami tahu siapa yang memesan.', f.nama);
      if (!(d.tamu >= 1 && d.tamu <= 50)) return fail('Jumlah tamu antara 1 sampai 50.', f.tamu);
      if (d.tanggal && d.tanggal < today) return fail('Tanggal berangkat sudah lewat. Pilih tanggal hari ini atau sesudahnya.', f.tgl);

      const ref = makeRef();
      const url = waLink(d, ref);
      // Buka WhatsApp langsung di dalam klik agar tidak diblokir pop-up blocker.
      window.open(url, '_blank', 'noopener');
      if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { currency: 'IDR', value: +selected().dataset.price, items: [{ item_id: d.paket }] });

      btn.disabled = true;
      try {
        const res = await fetch('/api/bookings', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...d, ref }), keepalive: true,
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          status.className = 'form-status ok';
          status.innerHTML = `Pesanan tercatat dengan kode <b>${json.ref || ref}</b>. WhatsApp tidak terbuka? <a href="${url}" target="_blank" rel="noopener">Buka di sini</a>.`;
        } else if (res.status === 422 && json.errors) {
          const first = Object.keys(json.errors)[0];
          fail(json.errors[first], f[first] || null);
        } else if (res.status === 429) {
          status.textContent = 'Terlalu banyak percobaan. Silakan lanjutkan lewat WhatsApp yang sudah terbuka.';
        } else {
          throw new Error('server');
        }
      } catch {
        // Server gagal bukan masalah besar bagi tamu: pesan tetap terkirim lewat WhatsApp.
        status.innerHTML = `Pesan Anda siap dikirim lewat WhatsApp. Belum terbuka? <a href="${url}" target="_blank" rel="noopener">Buka di sini</a>.`;
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- galeri + lightbox ---------- */
  const gallery = $('#gallery');
  const lb = $('#lb');
  if (gallery && lb) {
    const btns = [...gallery.querySelectorAll('.g')];
    let i = 0, last = null;
    const show = (n) => {
      i = (n + btns.length) % btns.length;
      const im = btns[i].querySelector('img');
      $('#lbImg').src = im.currentSrc || im.src;
      $('#lbImg').alt = im.alt;
      $('#lbCap').textContent = `${im.alt}  (${i + 1} dari ${btns.length})`;
    };
    const open = (n) => { last = document.activeElement; show(n); lb.classList.add('open'); document.body.style.overflow = 'hidden'; $('#lbX').focus(); };
    const close = () => { lb.classList.remove('open'); document.body.style.overflow = ''; if (last) last.focus(); };
    btns.forEach((b, n) => b.addEventListener('click', () => open(n)));
    $('#lbX').addEventListener('click', close);
    $('#lbP').addEventListener('click', () => show(i - 1));
    $('#lbN').addEventListener('click', () => show(i + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'Tab') { // fokus tetap di dalam dialog
        const f = [...lb.querySelectorAll('button')];
        const idx = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(idx + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
  }
})();
