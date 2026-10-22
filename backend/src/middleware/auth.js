// src/middleware/auth.js
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "secret_dev_change_me";

export function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token provided" });

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer")
    return res.status(401).json({ message: "Token malformed" });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, role, email }
    next();
  } catch (err) {
    // Cambio: los tokens vencidos responden 401 de forma controlada.
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
    return res.status(401).json({ message: "Token inválido" });
  }
}

export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "No autorizado" });
    if (allowedRoles.length && !allowedRoles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
