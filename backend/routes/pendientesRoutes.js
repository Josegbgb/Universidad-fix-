import { Router } from "express";
import { PendienteController } from "../controller/pendienteController.js";

export const pendienteRouter = Router();

// fase: pendiente_oct | pendiente_dic | pendiente_ene | pendiente_jun
pendienteRouter.get(
  "/:id_periodo/:fase/estudiantes",
  PendienteController.getEstudiantes,
);
pendienteRouter.get(
  "/:id_estudiante/historial",
  PendienteController.getHistorial,
);
pendienteRouter.patch("/nota/:id_pendiente", PendienteController.registrarNota);
pendienteRouter.post(
  "/:id_periodo/:fase/cerrar",
  PendienteController.cerrarFase,
);
