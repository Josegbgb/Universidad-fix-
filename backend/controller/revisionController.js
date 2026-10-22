import { RevisionModel } from "../models/revisionModel.js";
import { jsonResponse } from "../lib/jsonResponse.js";

// Cambio: acepta "IN" (inasistente) además de números.
function normalizarNota(nota) {
  if (typeof nota === "string" && nota.trim().toUpperCase() === "IN") return "IN";
  return Number(nota);
}

const ERRORES_400 = [
  "NOTA_REQUERIDA",
  "PENDIENTE_NO_ENCONTRADO",
  "PERIODO_NO_VALIDO",
  "PERIODO_NO_ENCONTRADO",
  "FASE_REVISION_NO_ABIERTA",
  "HAY_NOTAS_REVISION_PENDIENTES",
  "FORMATO_PERIODO_INVALIDO",
  // Cambio: no permite editar revision cerrada.
  "FASE_REVISION_CERRADA",
  "PENDIENTE_NO_ASIGNADO_AL_PROFESOR",
  "MATERIA_YA_APROBADA"
];

const MENSAJES_ERROR = {
  PERIODO_NO_VALIDO:
    "Debe crear o activar un periodo escolar antes de usar revision.",
  FASE_REVISION_NO_ABIERTA: "La fase de revision no esta abierta.",
  HAY_NOTAS_REVISION_PENDIENTES:
    "Hay notas de revision pendientes por registrar.",
  MATERIA_YA_APROBADA: "La materia ya fue aprobada y no se puede modificar.",
};

export class RevisionController {
  static getEstudiantesRevision(req, res) {
    try {
      const data = RevisionModel.getEstudiantesRevision(
        Number(req.params.id_periodo),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return RevisionController._error(res, error);
    }
  }

  static registrarNotaRevision(req, res) {
    try {
      const { id_pendiente } = req.params;
      const { nota } = req.body;

      // Cambio: revision registra notas sin cerrar ni mover estudiantes.
      const data = RevisionModel.registrarNotaRevision({
        id_pendiente: Number(id_pendiente),
        nota: normalizarNota(nota),
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return RevisionController._error(res, error);
    }
  }

  static getEstudiantesRevisionProfesor(req, res) {
    try {
      // Cambio: profesor consulta solo sus materias de revision.
      const data = RevisionModel.getEstudiantesRevisionByProfesor({
        userId: req.user.id,
        id_periodo: Number(req.params.id_periodo),
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return RevisionController._error(res, error);
    }
  }

  static registrarNotaRevisionProfesor(req, res) {
    try {
      const { id_pendiente } = req.params;
      const { nota } = req.body;

      // Cambio: nota de revision del profesor va separada de los lapsos normales.
      const data = RevisionModel.registrarNotaRevisionProfesor({
        userId: req.user.id,
        id_pendiente: Number(id_pendiente),
        nota: normalizarNota(nota),
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return RevisionController._error(res, error);
    }
  }

  static getMiRevision(req, res) {
    try {
      const data = RevisionModel.getRevisionByEstudianteUserId({
        userId: req.user.id,
      });
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return RevisionController._error(res, error);
    }
  }

  static cerrar(req, res) {
    // Cambio: el cierre real vive en /periodos/:id/revision/cerrar.
    return res.status(400).json(
      jsonResponse(400, {
        error: "USA POST /periodos/:id/revision/cerrar",
      }),
    );
  }

  static getEstudiantes(req, res) {
    return RevisionController.getEstudiantesRevision(req, res);
  }

  static registrarNota(req, res) {
    return RevisionController.registrarNotaRevision(req, res);
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
