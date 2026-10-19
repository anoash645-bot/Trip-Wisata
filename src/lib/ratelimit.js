'use strict';

/** Pembatas laju sederhana (jendela geser, di memori) per kunci, mis. alamat IP. */
function createLimiter({ limit, windowMs }) {
  const hits = new Map();
  const timer = setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [k, arr] of hits) {
      const fresh = arr.filter((t) => t > cutoff);
      if (fresh.length) hits.set(k, fresh); else hits.delete(k);
    }
  }, Math.min(windowMs, 60_000));
  timer.unref();

  return {
    /** @returns {{allowed:boolean, retryAfter:number}} */
    take(key) {
      const now = Date.now();
      const arr = (hits.get(key) || []).filter((t) => t > now - windowMs);
      if (arr.length >= limit) {
        hits.set(key, arr);
        return { allowed: false, retryAfter: Math.ceil((arr[0] + windowMs - now) / 1000) };
      }
      arr.push(now);
      hits.set(key, arr);
      return { allowed: true, retryAfter: 0 };
    },
  };
}

module.exports = { createLimiter };
