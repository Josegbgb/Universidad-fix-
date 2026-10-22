import { PendienteModel } from "../models/pendienteModel.js";
import { jsonResponse } from "../lib/jsonResponse.js";

// Cambio: acepta "IN" (inasistente) además de números.
function normalizarNota(nota) {
  if (typeof nota === "string" && nota.trim().toUpperCase() === "IN") return "IN";
  return Number(nota);
}

const ERRORES_400 = [
  "FASE_INVALIDA",
  "NOTA_REQUERIDA",
  "PENDIENTE_NO_ENCONTRADO",
  "MATERIA_YA_APROBADA",
  "FASE_NO_ABIERTA",
  "PERIODO_NO_VALIDO",
  "PERIODO_NO_ENCONTRADO",
  // Cambio: no permite editar momentos pendientes cerrados.
  "FASE_PENDIENTE_CERRADA",
  "PENDIENTE_NO_ASIGNADO_AL_PROFESOR",
];

const MENSAJES_ERROR = {
  PERIODO_NO_VALIDO:
    "Debe crear o activar un periodo escolar antes de usar materias pendientes.",
  FASE_NO_ABIERTA: "La fase de materias pendientes no esta abierta.",
  FASE_PENDIENTE_CERRADA: "La fase de materias pendientes esta cerrada.",
};

export class PendienteController {
  static getEstudiantesPorFase(req, res) {
    try {
      const { id_periodo, fase } = req.params;
      const data = PendienteModel.getEstudiantesPorFase(
        Number(id_periodo),
        fase,
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static getHistorialPendientes(req, res) {
    try {
      const data = PendienteModel.getHistorialPendientes(
        Number(req.params.id_estudiante),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static registrarNota(req, res) {
    try {
      const { id_pendiente } = req.params;
      const { nota, fase } = req.body;

      // Cambio: la fase del body valida que se actualice el momento correcto.
      const data = PendienteModel.registrarNota({
        id_pendiente: Number(id_pendiente),
        nota: normalizarNota(nota),
        fase,
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static getEstudiantesPorFaseProfesor(req, res) {
    try {
      const { id_periodo, fase } = req.params;
      // Cambio: profesor consulta solo pendientes de sus asignaturas.
      const data = PendienteModel.getEstudiantesPorFaseByProfesor({
        userId: req.user.id,
        id_periodo: Number(id_periodo),
        fase,
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static registrarNotaProfesor(req, res) {
    try {
      const { id_pendiente } = req.params;
      const { nota, fase } = req.body;

      // Cambio: nota de materia pendiente del profesor va separada de revision/lapso.
      const data = PendienteModel.registrarNotaProfesor({
        userId: req.user.id,
        id_pendiente: Number(id_pendiente),
        nota: normalizarNota(nota),
        fase,
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static getMisPendientes(req, res) {
    try {
      const data = PendienteModel.getPendientesByEstudianteUserId({
        userId: req.user.id,
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static cerrarFasePendiente(req, res) {
    try {
      const { id_periodo, fase } = req.params;
      const data = PendienteModel.cerrarFasePendiente(Number(id_periodo), fase);
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PendienteController._error(res, error);
    }
  }

  static getEstudiantes(req, res) {
    return PendienteController.getEstudiantesPorFase(req, res);
  }

  static getHistorial(req, res) {
    return PendienteController.getHistorialPendientes(req, res);
  }

  static cerrarFase(req, res) {
    return PendienteController.cerrarFasePendiente(req, res);
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
