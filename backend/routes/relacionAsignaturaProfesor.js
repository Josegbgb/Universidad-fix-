import { Router } from "express";
import { Relacion_asignatura_profesor } from "../controller/relacion_asignatura_profesor_controller.js";

export const relacionAsignaturaProfesorRouter = Router();

relacionAsignaturaProfesorRouter.get("/", Relacion_asignatura_profesor.getAll);
relacionAsignaturaProfesorRouter.get(
  "/:id_profesor",
  Relacion_asignatura_profesor.getById,
);
relacionAsignaturaProfesorRouter.post(
  "/",
  Relacion_asignatura_profesor.createRel,
);
relacionAsignaturaProfesorRouter.delete(
  "/:id",
  Relacion_asignatura_profesor.deleteRel,
);
relacionAsignaturaProfesorRouter.delete(
  "/profesor/:id_profesor",
  Relacion_asignatura_profesor.deleteByProfesor,
);
