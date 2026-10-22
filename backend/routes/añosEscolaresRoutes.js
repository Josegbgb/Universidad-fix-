import { Router } from "express";
import { añosEscolaresController } from "../controller/añosEscolaresController.js";

export const añosEscolaresRouter = Router();

añosEscolaresRouter.get("/", añosEscolaresController.getAll);
añosEscolaresRouter.get("/deshabilitados", añosEscolaresController.getDisabled);
añosEscolaresRouter.post("/", añosEscolaresController.createGrado);
añosEscolaresRouter.patch("/:id/deshabilitar", añosEscolaresController.disableGrade);
añosEscolaresRouter.patch("/:id/habilitar", añosEscolaresController.enableGrade);
añosEscolaresRouter.delete("/:id", añosEscolaresController.deleteGrade);
añosEscolaresRouter.patch("/:id", añosEscolaresController.updateGrade);