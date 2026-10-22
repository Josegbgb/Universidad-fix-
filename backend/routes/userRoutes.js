import { Router } from "express";
import { UserController } from "../controller/userController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";
import { get } from "../src/db.js";

export const userRoutes = Router();
//Login
userRoutes.post("/login", UserController.login);

function bootstrapPrimerAdmin(req, res, next) {
  const adminActivo = get(
    `SELECT 1
     FROM usuarios u
     INNER JOIN administradores a ON a.id_usuario = u.id
     WHERE u.role = 'admin'
       AND u.activo = 1
       AND u.deleted_at IS NULL
       AND a.deleted_at IS NULL
     LIMIT 1`,
  );

  // Cambio: permite crear el primer admin sin token solo si aun no existe uno activo.
  if (!adminActivo && req.body?.role === "admin") return next();

  return authenticate(req, res, () => authorize(["admin"])(req, res, next));
}

//registro(admin)
userRoutes.post(
  "/register",
  bootstrapPrimerAdmin,
  UserController.registerByAdmin,
);

// ===============================
// 🔐 LOGIN
// ===============================

// ===============================
// 🔑 CAMBIAR PASSWORD
// ===============================
userRoutes.put(
  "/password",
  authenticate,
  UserController.changePassword,
);

userRoutes.patch(
  "/reset-password/:id",
  authenticate,
  authorize(["admin"]),
  UserController.resetPassword,
);

// ===============================
// 📋 LISTAR USUARIOS (ADMIN)
// ===============================
userRoutes.get(
  "/users",
  authenticate,
  authorize(["admin"]),
  UserController.listAllUsers,
);

// ===============================
// 🗑 SOFT DELETE USER (ADMIN)
// ===============================
userRoutes.delete(
  "/delete/:id",
  authenticate,
  authorize(["admin"]),
  UserController.deleteUser,
);

userRoutes.patch(
  "/status/:id",
  authenticate,
  authorize(["admin"]),
  UserController.toggleUserStatus,
);

// Cambio: el perfil propio siempre se consulta con token JWT.
userRoutes.get("/me", authenticate, UserController.getMyProfile);

// Cambio: el perfil propio siempre se edita con token JWT.
userRoutes.put("/me", authenticate, UserController.updateMyProfile);
