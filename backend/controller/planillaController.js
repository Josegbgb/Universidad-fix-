import { PlanillaModel } from "../models/planillaModel.js";
import { jsonResponse } from "../lib/jsonResponse.js";

const ERRORES_400 = [
  "PERIODO_NO_ENCONTRADO",
  "GRADO_NO_ENCONTRADO",
  "FASE_INVALIDA",
];

export class PlanillaController {
  static getFinalizacion(req, res) {
    try {
      const { id_periodo, id_grado } = req.params;
      const data = PlanillaModel.getFinalizacion(
        Number(id_periodo),
        Number(id_grado),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PlanillaController._error(res, error);
    }
  }

  static getRevision(req, res) {
    try {
      const { id_periodo, id_grado } = req.params;
      const data = PlanillaModel.getRevision(
        Number(id_periodo),
        Number(id_grado),
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PlanillaController._error(res, error);
    }
  }

  static getPendiente(req, res) {
    try {
      const { id_periodo, id_grado, fase } = req.params;

      // Cambio: la planilla de pendiente se limita a la fase solicitada.
      const data = PlanillaModel.getPendiente(
        Number(id_periodo),
        Number(id_grado),
        fase,
      );
      return res.json(jsonResponse(200, data));
    } catch (error) {
      return PlanillaController._error(res, error);
    }
  }

  static _error(res, error) {
    const status = ERRORES_400.includes(error.message) ? 400 : 500;
    return res.status(status).json(jsonResponse(status, { error: error.message }));
  }
}
