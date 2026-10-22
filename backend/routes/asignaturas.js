import { AsignaturasController } from "../controller/asignaturasController.js";
import { Router } from "express";

export const asignaturasRouter = Router();

asignaturasRouter.get("/", AsignaturasController.getAllAsignaturas);
asignaturasRouter.post("/", AsignaturasController.createAsignatura);
asignaturasRouter.delete("/:id", AsignaturasController.deleteAsignatura);
asignaturasRouter.patch("/:id", AsignaturasController.updateAsignatura);
