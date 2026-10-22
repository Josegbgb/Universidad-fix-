import { Router } from "express";
import { AnioAsignaturaTemplateController } from "../controller/anioAsignaturaTemplateController.js";

export const anioAsignaturaTemplateRouter = Router();

anioAsignaturaTemplateRouter.get(
  "/:anio",
  AnioAsignaturaTemplateController.getByAnio,
);
anioAsignaturaTemplateRouter.post("/", AnioAsignaturaTemplateController.add);
anioAsignaturaTemplateRouter.delete(
  "/:anio/:id_asignatura",
  AnioAsignaturaTemplateController.remove,
);
