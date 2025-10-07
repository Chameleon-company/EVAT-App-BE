// Fix in admin-auth-controller.ts (inside signup/login functions)
import bcrypt from "bcrypt";

// Example fix during signup:
const hashedPassword = await bcrypt.hash(password, 10);
await Admin.create({ email, password: hashedPassword });

// Example fix during login:
const isMatch = await bcrypt.compare(password, admin.password);
if (!isMatch) throw new Error("Invalid credentials");
