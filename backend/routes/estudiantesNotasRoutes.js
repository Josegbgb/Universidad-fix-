import { Router } from "express";
import { EstudianteNotasController } from "../controller/estudiantesNotasController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";

export const estudianteNotasRoutes = Router();

estudianteNotasRoutes.get(
  "/mis-notas",
  authenticate,
  authorize(["estudiante"]),
  EstudianteNotasController.getNotas,
);
estudianteNotasRoutes.get(
  "/mis-notas/historial",
  authenticate,
  authorize(["estudiante"]),
  EstudianteNotasController.getHistorial,
);

// Cambio: el historial por id expone datos academicos y queda solo para admin.
estudianteNotasRoutes.get(
  "/historial/:id_estudiante",
  authenticate,
  authorize(["admin"]),
  EstudianteNotasController.getHistorialByStudentId,
);
