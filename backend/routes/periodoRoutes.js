import { Router } from "express";
import { PeriodoController } from "../controller/periodoController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";

export const periodoRouter = Router();

// Cambio: rutas oficiales del flujo de periodos escolares.
periodoRouter.get(
  "/",
  authenticate,
  authorize(["admin", "profesor", "estudiante"]),
  PeriodoController.getAll,
);
periodoRouter.get(
  "/activo",
  authenticate,
  authorize(["admin", "profesor", "estudiante"]),
  PeriodoController.getActivo,
);
periodoRouter.get("/:id", authenticate, authorize(["admin"]), PeriodoController.getById);
periodoRouter.get(
  "/:id/resumen",
  authenticate,
  authorize(["admin"]),
  PeriodoController.getResumen,
);
periodoRouter.get(
  "/:id/revision/preview",
  authenticate,
  authorize(["admin"]),
  PeriodoController.previewCierreRevision,
);
periodoRouter.post("/", authenticate, authorize(["admin"]), PeriodoController.crear);
periodoRouter.patch(
  "/:id/activar",
  authenticate,
  authorize(["admin"]),
  PeriodoController.activar,
);
periodoRouter.post(
  "/:id/revision/cerrar",
  authenticate,
  authorize(["admin"]),
  PeriodoController.cerrarRevision,
);
periodoRouter.patch(
  "/:id/fases/:fase/abrir",
  authenticate,
  authorize(["admin"]),
  PeriodoController.abrirFase,
);
periodoRouter.patch(
  "/:id/fases/:fase/cerrar",
  authenticate,
  authorize(["admin"]),
  PeriodoController.cerrarFase,
);
periodoRouter.post(
  "/:id/revision-especial/abrir",
  authenticate,
  authorize(["admin"]),
  PeriodoController.abrirRevisionEspecial,
);