import { Router } from "express";
import { RelProfesorAsignaturaController } from "../controller/asignaturaProfesorTemplateController.js";

export const relProfesorAsignaturaRouter = Router();

// obtener materias del profesor
relProfesorAsignaturaRouter.get(
  "/:id_profesor",
  RelProfesorAsignaturaController.getByProfesor,
);

// guardar multiselect
relProfesorAsignaturaRouter.post(
  "/:id_profesor",
  RelProfesorAsignaturaController.assign,
);

// sync (update completo)
relProfesorAsignaturaRouter.put(
  "/:id_profesor",
  RelProfesorAsignaturaController.sync,
);
