import { Router } from "express";
import { PromocionController } from "../controller/promocionController.js";

export const Promociones = Router();

// promocion routes
Promociones.get(
  "/promocion/evaluar/:id",
  PromocionController.evaluarEstudiante,
);
Promociones.post(
  "/promocion/promover/:id",
  PromocionController.promoverEstudiante,
);
Promociones.post(
  "/promocion/revertir/:id",
  PromocionController.revertirPromocion,
);
Promociones.post(
  "/promocion/promover-todos",
  PromocionController.promoverTodos,
);
Promociones.post(
  "/promocion/revertir-todos",
  PromocionController.revertirTodos,
);
