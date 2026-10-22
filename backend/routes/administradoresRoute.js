import { Router } from "express";
import { AdministradoresController } from "../controller/administradoresController.js";

export const administradoresRouter = Router();

administradoresRouter.get("/", AdministradoresController.getAll);
administradoresRouter.get("/deleted", AdministradoresController.getDeleted);
administradoresRouter.post("/", AdministradoresController.createAdministrador);

administradoresRouter.patch(
  "/:id",
  AdministradoresController.updateAdministrador,
);
administradoresRouter.delete(
  "/:id",
  AdministradoresController.deleteAdministrador,
);
administradoresRouter.patch(
  "/:id/restore",
  AdministradoresController.restoreAdministrador,
);
administradoresRouter.get("/byid/:id", AdministradoresController.getById);
administradoresRouter.get("/:cedula", AdministradoresController.getByCedula);
