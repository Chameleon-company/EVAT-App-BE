// Fix in auth-middleware.ts
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET as string;
if (!secret) throw new Error("JWT_SECRET missing in env file");

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
};
