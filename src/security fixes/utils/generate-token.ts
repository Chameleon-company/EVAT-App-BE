import jwt from 'jsonwebtoken';

export const generateToken = (user, expiresIn = "15m") => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn, algorithm: 'HS256', issuer: 'evat-api' }
  );
};
