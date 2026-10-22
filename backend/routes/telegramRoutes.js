import { Router } from "express";
import { TelegramController } from "../controller/telegramController.js";
import { authenticate, authorize } from "../src/middleware/auth.js";

export const telegramRouter = Router();

// Cambio: endpoints protegidos para vincular la cuenta propia con Telegram.
telegramRouter.get(
  "/vinculacion",
  authenticate,
  authorize(["admin", "profesor", "estudiante"]),
  TelegramController.getEstadoVinculacion,
);

telegramRouter.post(
  "/vinculacion/codigo",
  authenticate,
  authorize(["admin", "profesor", "estudiante"]),
  TelegramController.generarCodigoVinculacion,
);

telegramRouter.post(
  "/representantes/:id_representante/codigo",
  authenticate,
  authorize(["admin"]),
  TelegramController.generarCodigoRepresentante,
);

// Cambio: accion manual administrativa para avisar notas pendientes.
telegramRouter.post(
  "/recordatorios/notas-pendientes",
  authenticate,
  authorize(["admin"]),
  TelegramController.enviarRecordatorioNotasPendientes,
);
