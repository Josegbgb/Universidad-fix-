import { RelacionGradosAsignaturaController } from "../controller/relacion_grado_asignaturaController.js";
import { Router } from "express";

export const relacionGradoAsignaturaRouter = Router();

relacionGradoAsignaturaRouter.get(
  "/",
  RelacionGradosAsignaturaController.getAll
);
relacionGradoAsignaturaRouter.post(
  "/",
  RelacionGradosAsignaturaController.createRelacion
);
relacionGradoAsignaturaRouter.delete(
  "/:anio/:asignatura",
  RelacionGradosAsignaturaController.deleteRelacion
);
