import { FinalizacionModel } from "../models/finalizacionModel.js";
import { jsonResponse } from "../lib/jsonResponse.js";

const ERRORES_400 = ["PERIODO_NO_VALIDO", "FASE_FINALIZACION_NO_ABIERTA"];

const MENSAJES_ERROR = {
  PERIODO_NO_VALIDO:
    "Debe crear o activar un periodo escolar antes de usar finalizacion.",
  FASE_FINALIZACION_NO_ABIERTA:
    "La fase de finalizacion no esta abierta para este periodo.",
};

export class FinalizacionController {
  static getEstudiantesFinalizacion(req, res) {
    try {
      const data = FinalizacionModel.getEstudiantesFinalizacion(
        Number(req.params.id_periodo),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return FinalizacionController._error(res, error);
    }
  }

  static previewCierre(req, res) {
    try {
      const data = FinalizacionModel.previewCierre(Number(req.params.id_periodo));
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return FinalizacionController._error(res, error);
    }
  }

  static evaluarEstudiante(req, res) {
    try {
      const { id_periodo, id_est, id_estudiante } = req.params;
      const data = FinalizacionModel.evaluarEstudiante(
        Number(id_est ?? id_estudiante),
        Number(id_periodo),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return FinalizacionController._error(res, error);
    }
  }

  static cerrarFinalizacion(req, res) {
    try {
      // Cambio: este cierre genera estados y abre revision.
      const data = FinalizacionModel.cerrarFinalizacion(
        Number(req.params.id_periodo),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return FinalizacionController._error(res, error);
    }
  }

  // Cambio: aliases para rutas antiguas ya existentes.
  static getEstudiantes(req, res) {
    return FinalizacionController.getEstudiantesFinalizacion(req, res);
  }

  static preview(req, res) {
    return FinalizacionController.previewCierre(req, res);
  }

  static cerrar(req, res) {
    return FinalizacionController.cerrarFinalizacion(req, res);
  }

  static _error(res, error) {
    const status = ERRORES_400.includes(error.message) ? 400 : 500;
    return res.status(status).json(
      jsonResponse(status, {
        error: error.message,
        mensaje: MENSAJES_ERROR[error.message],
      }),
    );
  }
}
