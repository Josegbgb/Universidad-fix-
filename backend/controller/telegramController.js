import { jsonResponse } from "../lib/jsonResponse.js";
import { TelegramService } from "../services/telegramService.js";

const ERRORES_400 = [
  "NO_PERIODO_ACTIVO",
  "NO_SE_PUDO_GENERAR_CODIGO",
  "REPRESENTANTE_NO_ENCONTRADO",
];

export class TelegramController {
  static getEstadoVinculacion(req, res) {
    try {
      // Cambio: cada usuario autenticado consulta su propia vinculacion.
      const data = TelegramService.getEstadoVinculacionUsuario(req.user.id);
      return res.json(jsonResponse(200, { vinculado: Boolean(data), data }));
    } catch (error) {
      return TelegramController._error(res, error);
    }
  }

  static generarCodigoVinculacion(req, res) {
    try {
      // Cambio: codigo de un solo uso para vincular Telegram desde la web.
      const data = TelegramService.generarCodigoUsuario(req.user.id);
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return TelegramController._error(res, error);
    }
  }

  static generarCodigoRepresentante(req, res) {
    try {
      // Cambio: permite vincular representantes sin agregar un rol auth nuevo.
      const data = TelegramService.generarCodigoRepresentante(
        Number(req.params.id_representante),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return TelegramController._error(res, error);
    }
  }

  static async enviarRecordatorioNotasPendientes(req, res) {
    try {
      // Cambio: accion manual de Control de Estudio para profesores con notas pendientes.
      const data = await TelegramService.enviarRecordatoriosNotasPendientes({
        id_periodo: req.body?.id_periodo,
        id_lapso: req.body?.id_lapso,
      });

      return res.json(jsonResponse(200, data));
    } catch (error) {
      return TelegramController._error(res, error);
    }
  }

  static _error(res, error) {
    const status = ERRORES_400.includes(error.message) ? 400 : 500;
    return res.status(status).json(
      jsonResponse(status, {
        error: error.message,
      }),
    );
  }
}
