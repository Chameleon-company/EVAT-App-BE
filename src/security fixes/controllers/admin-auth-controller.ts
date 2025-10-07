import crypto from 'crypto';

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// Generate code
const rawCode = Math.floor(100000 + Math.random() * 900000).toString();
admin.twoFactorCode = hashCode(rawCode);
admin.twoFactorCodeExpiry = new Date(Date.now() + 5 * 60 * 1000);
await admin.save();
// send `rawCode` via email

// Verify code
if (hashCode(providedCode) !== admin.twoFactorCode || new Date() > admin.twoFactorCodeExpiry) {
  return res.status(400).json({ message: 'Invalid/Expired code' });
}
