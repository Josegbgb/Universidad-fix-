import { PromocionModel } from "../models/promocionModel.js";
import { jsonResponse } from "../lib/jsonResponse.js";

export class PromocionController {
  // Evaluar un estudiante
  static async evaluarEstudiante(req, res) {
    try {
      const { id } = req.params;
      const resultado = PromocionModel.evaluarEstudiante(Number(id));
      return res.json(jsonResponse(200, resultado));
    } catch (err) {
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  // Promover un estudiante
  static async promoverEstudiante(req, res) {
    try {
      const { id } = req.params;
      const resultado = PromocionModel.promoverEstudiante(Number(id));
      return res.json(jsonResponse(200, resultado));
    } catch (err) {
      if (err.message === "GRADO_SIGUIENTE_NO_EXISTE") {
        return res.status(400).json(
          jsonResponse(400, {
            error: "No existe el grado del siguiente año",
          }),
        );
      }
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  // Revertir promoción de un estudiante
  static async revertirPromocion(req, res) {
    try {
      const { id } = req.params;
      const resultado = PromocionModel.revertirPromocion(Number(id));
      return res.json(jsonResponse(200, resultado));
    } catch (err) {
      if (err.message === "NO_HAY_PROMOCION_PARA_REVERTIR") {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "No hay promoción para revertir" }));
      }
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  // Promover todos
  static async promoverTodos(req, res) {
    try {
      const resultado = PromocionModel.promoverTodos();
      return res.json(jsonResponse(200, resultado));
    } catch (err) {
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  static async revertirTodos(req, res) {
    try {
      const resultado = PromocionModel.revertirTodos();
      return res.json(jsonResponse(200, resultado));
    } catch (err) {
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }
}
