const token = jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  secret as string,
  {
    expiresIn: period ? period : "1d",
    issuer: process.env.JWT_ISSUER || "api",
    audience: process.env.JWT_AUDIENCE || "web",
  }
);
