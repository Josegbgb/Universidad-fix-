import { Router } from "express";
import { EstudiantesController } from "../controller/estudianteController.js";

export const estudianteRouter = Router();

estudianteRouter.get("/", EstudiantesController.getAll);
estudianteRouter.get("/deleted", EstudiantesController.getDeleted);
estudianteRouter.post("/", EstudiantesController.createStudent);
estudianteRouter.get("/egresados", EstudiantesController.getEgresados);
estudianteRouter.get("/:cedula", EstudiantesController.GetByCedula);
estudianteRouter.patch("/:id", EstudiantesController.UpdateStudent);
estudianteRouter.delete("/:id", EstudiantesController.DeleteStudent);
estudianteRouter.delete("/hard/:id", EstudiantesController.hardDeleteStudent);
estudianteRouter.patch("/:id/restore", EstudiantesController.RestoreStudent);
