import { PeriodoModel } from "../models/periodoModel.js";
import { RevisionModel } from "../models/revisionModel.js";
import { jsonResponse } from "../lib/jsonResponse.js";
import { TelegramService } from "../services/telegramService.js";

const ERRORES_400 = [
  "NOMBRE_PERIODO_INVALIDO",
  "YA_EXISTE_PERIODO_ACTIVO",
  "PERIODO_YA_EXISTE",
  "PERIODO_NO_ENCONTRADO",
  "PERIODO_NO_VALIDO",
  "PERIODO_YA_CERRADO",
  "FASE_NO_ENCONTRADA",
  "FASE_YA_ABIERTA",
  "FASE_YA_CERRADA",
  "FASE_REVISION_NO_ABIERTA",
  "REVISION_SE_ABRE_AUTOMATICAMENTE",
  "USA_CERRAR_REVISION_Y_NUEVO_PERIODO",
  "DEBE_CERRAR_REVISION_PRIMERO",
  "HAY_NOTAS_REVISION_PENDIENTES",
  "PERIODO_SIGUIENTE_YA_EXISTE",
  "FORMATO_PERIODO_INVALIDO",
  "NO_PERIODO_ACTIVO",
  "NOMBRE_PERIODO_REQUERIDO",
  "USA_ABRIR_REVISION_ESPECIAL",
  "REVISION_ESPECIAL_YA_USADA",
  "SIN_MATERIAS_PARA_REVISION_ESPECIAL",
];

const MENSAJES_ERROR = {
  NO_PERIODO_ACTIVO: "Debe crear o activar un periodo escolar antes de continuar.",
  PERIODO_NO_VALIDO:
    "El periodo escolar debe existir, estar activo y no estar cerrado.",
    USA_ABRIR_REVISION_ESPECIAL:
    "La revisión especial se abre desde el botón de revisión especial.",
  REVISION_ESPECIAL_YA_USADA:
    "La revisión especial ya se utilizó en este periodo.",
  SIN_MATERIAS_PARA_REVISION_ESPECIAL:
    "No hay materias sin aprobar para una revisión especial.",
};

export class PeriodoController {
  static getAll(req, res) {
    try {
      const data = PeriodoModel.getAll();
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static getActivo(req, res) {
    try {
      const data = PeriodoModel.getActivo();
      if (!data) {
        return res
          .status(404)
          .json(
            jsonResponse(404, {
              error: "NO_PERIODO_ACTIVO",
              mensaje: MENSAJES_ERROR.NO_PERIODO_ACTIVO,
            }),
          );
      }
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static getById(req, res) {
    try {
      const data = PeriodoModel.getById(Number(req.params.id));
      if (!data) {
        return res
          .status(404)
          .json(jsonResponse(404, { error: "PERIODO_NO_ENCONTRADO" }));
      }
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static getResumen(req, res) {
    try {
      const data = PeriodoModel.getResumen(Number(req.params.id));
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static previewCierreRevision(req, res) {
    try {
      const data = RevisionModel.previewCierreRevision(Number(req.params.id));
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static crear(req, res) {
    try {
      const { nombre, fecha_inicio, fecha_fin } = req.body;
      if (!nombre) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "NOMBRE_PERIODO_REQUERIDO" }));
      }

      // Cambio: solo crea el periodo manual inicial.
      const data = PeriodoModel.crear({ nombre, fecha_inicio, fecha_fin });
      return res.status(201).json(jsonResponse(201, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static activar(req, res) {
    try {
      // Cambio: habilita la activacion manual cuando la BD no tiene periodo activo.
      const data = PeriodoModel.activar(Number(req.params.id));
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static cerrarRevision(req, res) {
    try {
      const id_periodo = Number(req.params.id);

      // Cambio: primero evalua resultados y luego genera el nuevo periodo.
      const revision = RevisionModel.evaluarResultadosRevision(id_periodo);
      const periodo = PeriodoModel.cerrarRevisionYNuevoPeriodo(id_periodo);

      // Cambio: notifica el resultado final luego de cerrar el periodo correctamente.
      PeriodoController._notificarResultadosFinales(periodo);

      return res.json(jsonResponse(200, { revision, periodo }));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static abrirRevisionEspecial(req, res) {
    try {
      const data = PeriodoModel.abrirRevisionEspecial(Number(req.params.id));
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static abrirFase(req, res) {
    try {
      const { id, fase } = req.params;
      const data = PeriodoModel.abrirFase(Number(id), fase);
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
  }

  static cerrarFase(req, res) {
    try {
      const { id, fase } = req.params;
      const data = PeriodoModel.cerrarFase(Number(id), fase);
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PeriodoController._error(res, error);
    }
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

  static _notificarResultadosFinales(periodo) {
    const nombrePeriodo = periodo?.periodoAnterior?.nombre;
    const grupos = [
      {
        items: periodo?.aprobados ?? [],
        resultado: "Aprobado",
        detalle: "Avanza al siguiente anio escolar.",
      },
      {
        items: periodo?.conPendientes ?? [],
        resultado: "Aprobado con materias pendientes",
        detalle: "Avanza con materias pendientes al nuevo periodo.",
      },
      {
        items: periodo?.reprobados ?? [],
        resultado: "Reprobado",
        detalle: "Debe repetir el anio escolar segun el cierre de revision.",
      },
      {
        items: periodo?.egresados ?? [],
        resultado: "Egresado",
        detalle: "Completo el quinto anio.",
      },
    ];

    for (const grupo of grupos) {
      for (const item of grupo.items) {
        void TelegramService.notificarResultadoFinal(item.id_estudiante, {
          periodo: nombrePeriodo,
          resultado: grupo.resultado,
          detalle: grupo.detalle,
        });
      }
    }
  }
}
