import { Router } from "express";
import { RevisionController } from "../controller/revisionController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";

export const revisionRouter = Router();

// Cambio: revision no cierra periodo; solo lista y registra notas.
revisionRouter.get(
  "/:id_periodo/estudiantes",
  authenticate,
  authorize(["admin"]),
  RevisionController.getEstudiantesRevision,
);
revisionRouter.patch(
  "/nota/:id_pendiente",
  authenticate,
  authorize(["admin"]),
  RevisionController.registrarNotaRevision,
);
revisionRouter.get(
  "/profesor/:id_periodo/estudiantes",
  authenticate,
  authorize(["profesor"]),
  RevisionController.getEstudiantesRevisionProfesor,
);
revisionRouter.patch(
  "/profesor/nota/:id_pendiente",
  authenticate,
  authorize(["profesor"]),
  RevisionController.registrarNotaRevisionProfesor,
);
revisionRouter.get(
  "/mis-revisiones",
  authenticate,
  authorize(["estudiante"]),
  RevisionController.getMiRevision,
);
revisionRouter.post(
  "/:id_periodo/cerrar",
  authenticate,
  authorize(["admin"]),
  RevisionController.cerrar,
);
