import { ProfesoresController } from "../controller/profesoresController.js";
import { Router } from "express";

export const profesoresRouter = Router();

profesoresRouter.get("/", ProfesoresController.getAll);
profesoresRouter.get("/deleted", ProfesoresController.getDeleted);
profesoresRouter.post("/", ProfesoresController.createProfesor);
profesoresRouter.get("/:cedula", ProfesoresController.getByCedula);
profesoresRouter.patch("/:id", ProfesoresController.updateProfesor);
profesoresRouter.delete("/:id", ProfesoresController.deleteProfesor);
profesoresRouter.patch("/:id/restore", ProfesoresController.RestoreProfesor);
profesoresRouter.get("/byid/:id", ProfesoresController.getById);
profesoresRouter.get(
  "/con-capacidades",
  ProfesoresController.getAllWithCapacidades,
);
