'use strict';
const crypto = require('crypto');

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const bad = (msg) => new HttpError(422, msg);
const newId = () => crypto.randomUUID().replace(/-/g, '');
const nowIso = () => new Date().toISOString();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const USER_RE = /^[A-Za-z0-9_-]{1,64}$/;
/** Belum ada login: frontend mengirim id anonim lewat header X-User-Id. */
function userId(req) {
  const h = req.get('x-user-id');
  if (h === undefined) return 'demo-user';
  if (!USER_RE.test(h)) throw new HttpError(400, 'Header X-User-Id tidak valid.');
  return h;
}

function countWords(text) {
  const t = String(text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

// ---------- validator kecil ----------
function str(body, key, { min = 0, max = 1000, required = true, label = key } = {}) {
  let v = body[key];
  if (v === undefined || v === null) {
    if (required) throw bad(`${label} wajib diisi.`);
    return '';
  }
  if (typeof v !== 'string') throw bad(`${label} harus berupa teks.`);
  v = v.trim();
  if (v.length < min) throw bad(min === 1 ? `${label} wajib diisi.` : `${label} minimal ${min} karakter.`);
  if (v.length > max) throw bad(`${label} maksimal ${max} karakter.`);
  return v;
}

function int(body, key, { min, max, required = true, label = key } = {}) {
  const v = body[key];
  if (v === undefined || v === null) {
    if (required) throw bad(`${label} wajib diisi.`);
    return null;
  }
  if (typeof v !== 'number' || !Number.isInteger(v)) throw bad(`${label} harus berupa bilangan bulat.`);
  if (min !== undefined && v < min) throw bad(`${label} minimal ${min}.`);
  if (max !== undefined && v > max) throw bad(`${label} maksimal ${max}.`);
  return v;
}

function oneOf(body, key, allowed, { required = true, label = key } = {}) {
  const v = body[key];
  if (v === undefined || v === null) {
    if (required) throw bad(`${label} wajib diisi.`);
    return null;
  }
  if (!allowed.includes(v)) throw bad(`${label} harus salah satu dari: ${allowed.join(', ')}.`);
  return v;
}

module.exports = { HttpError, bad, newId, nowIso, wrap, userId, countWords, str, int, oneOf };
