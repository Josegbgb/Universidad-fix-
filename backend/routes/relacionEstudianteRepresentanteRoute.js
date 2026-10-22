import { Router } from "express";
import { RelacionEstudiantesRepresentantesController } from "../controller/relacion_estudiante_representanteController.js";

export const relacionEstudianteRepresentanteRouter = Router();

relacionEstudianteRepresentanteRouter.get(
  "/",
  RelacionEstudiantesRepresentantesController.getAll,
);

relacionEstudianteRepresentanteRouter.post(
  "/",
  RelacionEstudiantesRepresentantesController.createRelacion,
);
relacionEstudianteRepresentanteRouter.delete(
  "/:id",
  RelacionEstudiantesRepresentantesController.deleteRelacion,
);
relacionEstudianteRepresentanteRouter.patch(
  "/:id",
  RelacionEstudiantesRepresentantesController.updateRelacion,
);
