import { Router } from "express";
import { PlanillaController } from "../controller/planillaController.js";

export const planillaRouter = Router();

// Cambio: rutas para datos de la planilla oficial 31060.
planillaRouter.get(
  "/finalizacion/:id_periodo/:id_grado",
  PlanillaController.getFinalizacion,
);
planillaRouter.get(
  "/revision/:id_periodo/:id_grado",
  PlanillaController.getRevision,
);
planillaRouter.get(
  "/pendiente/:id_periodo/:id_grado/:fase",
  PlanillaController.getPendiente,
);
