import { Router } from "express";
import { RelacionEstudianteGradoController } from "../controller/relacion_estudiante_grado.js";

export const relacionEstudianteGradosRouter = Router();

relacionEstudianteGradosRouter.get(
  "/",
  RelacionEstudianteGradoController.getAll
);
relacionEstudianteGradosRouter.post(
  "/",
  RelacionEstudianteGradoController.createRelacion
);
relacionEstudianteGradosRouter.delete(
  "/:id_estudiante",
  RelacionEstudianteGradoController.deleteRelacion
);
relacionEstudianteGradosRouter.patch(
  "/:id",
  RelacionEstudianteGradoController.updateRelacion
);
