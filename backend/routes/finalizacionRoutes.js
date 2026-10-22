import { Router } from "express";
import { FinalizacionController } from "../controller/finalizacionController.js";

export const finalizacionRouter = Router();

finalizacionRouter.get(
  "/:id_periodo/estudiantes",
  FinalizacionController.getEstudiantesFinalizacion,
);
finalizacionRouter.get(
  "/:id_periodo/preview",
  FinalizacionController.previewCierre,
);
finalizacionRouter.get(
  "/:id_periodo/evaluar/:id_est",
  FinalizacionController.evaluarEstudiante,
);
// Cambio: cierre definitivo de finalizacion del periodo.
finalizacionRouter.post(
  "/:id_periodo/cerrar",
  FinalizacionController.cerrarFinalizacion,
);
