import { Router } from "express";
import { ProfesorDashboardController } from "../controller/ProfesorNotasController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";

export const profesorNotaRoutes = Router();

profesorNotaRoutes.get(
  "/mis-asignaciones/:correo",
  authenticate,
  authorize(["profesor", "admin"]),
  ProfesorDashboardController.getMisAsignaciones,
);
profesorNotaRoutes.get(
  "/asignaciones/:id_profesor",
  authenticate,
  authorize(["admin"]),
  ProfesorDashboardController.getAsignaciones,
);

profesorNotaRoutes.get(
  "/notas/:id_rel_grado_asignatura",
  authenticate,
  authorize(["profesor", "admin"]),
  ProfesorDashboardController.getNotasByAsignacion,
);

// Cambio: guardar notas exige token y rol de profesor/admin.
profesorNotaRoutes.post(
  "/notas",
  authenticate,
  authorize(["profesor", "admin"]),
  ProfesorDashboardController.saveNota,
);
profesorNotaRoutes.get(
  "/admin/notas/grado/:id_grado",
  authenticate,
  authorize(["admin"]),
  ProfesorDashboardController.getNotasByGrado,
);
