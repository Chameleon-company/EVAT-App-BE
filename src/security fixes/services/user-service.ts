import crypto from 'crypto';

function generateOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}
function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// When issuing refresh token:
const refreshToken = generateOpaqueToken();
user.refreshToken = hashToken(refreshToken);
user.refreshTokenExpiresAt = new Date(Date.now() + 30*24*60*60*1000); // 30 days
await user.save();
