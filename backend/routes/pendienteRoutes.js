import { Router } from "express";
import { PendienteController } from "../controller/pendienteController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";

export const pendienteRouter = Router();

// Cambio: endpoints de materias pendientes por fase.
pendienteRouter.get(
  "/:id_periodo/:fase/estudiantes",
  authenticate,
  authorize(["admin"]),
  PendienteController.getEstudiantesPorFase,
);
pendienteRouter.get(
  "/:id_estudiante/historial",
  authenticate,
  authorize(["admin"]),
  PendienteController.getHistorialPendientes,
);
pendienteRouter.patch(
  "/nota/:id_pendiente",
  authenticate,
  authorize(["admin"]),
  PendienteController.registrarNota,
);
pendienteRouter.get(
  "/profesor/:id_periodo/:fase/estudiantes",
  authenticate,
  authorize(["profesor"]),
  PendienteController.getEstudiantesPorFaseProfesor,
);
pendienteRouter.patch(
  "/profesor/nota/:id_pendiente",
  authenticate,
  authorize(["profesor"]),
  PendienteController.registrarNotaProfesor,
);
pendienteRouter.get(
  "/mis-pendientes",
  authenticate,
  authorize(["estudiante"]),
  PendienteController.getMisPendientes,
);
pendienteRouter.post(
  "/:id_periodo/:fase/cerrar",
  authenticate,
  authorize(["admin"]),
  PendienteController.cerrarFasePendiente,
);
