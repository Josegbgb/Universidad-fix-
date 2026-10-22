import { Router } from "express";
import { RevisionController } from "../controller/revisionController.js";

export const revisionRouter = Router();

revisionRouter.get("/:id_periodo/estudiantes", RevisionController.getEstudiantes);
revisionRouter.patch("/nota/:id_pendiente", RevisionController.registrarNota);
revisionRouter.post("/:id_periodo/cerrar", RevisionController.cerrar);