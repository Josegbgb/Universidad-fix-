import { Router } from "express";
import { RepresentantesController } from "../controller/representantesController.js";

export const representanteRouter = Router();

representanteRouter.get("/", RepresentantesController.getAll);
representanteRouter.get("/deleted", RepresentantesController.getDeleted);
representanteRouter.post("/", RepresentantesController.createRepresentante);
representanteRouter.patch("/:id", RepresentantesController.UpdateRepresentante);
representanteRouter.patch(
  "/:id/restore",
  RepresentantesController.RestoreRepresentante,
);
representanteRouter.get("/:cedula", RepresentantesController.GetByCedula);
representanteRouter.delete(
  "/hard/:id",
  RepresentantesController.hardDeleteRepresentante,
);

representanteRouter.delete(
  "/:id",
  RepresentantesController.DeleteRepresentante,
);
