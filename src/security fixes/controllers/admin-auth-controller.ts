function isEmail(x: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }
function nonEmpty(x?: string) { return !!x && x.trim().length > 0; }


import crypto from 'crypto';

// helper (top of file)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
  return `${salt}:${hash}`; // "salt:hash"
}

// inside updateAdminCredentials before saving:
if (password) {
  admin.password = hashPassword(password);
}
