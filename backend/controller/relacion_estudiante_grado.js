import { id } from "zod/locales";
import { RelacionEstudianteGradoModel } from "../models/relacion_estudiante_grado.js";
import {
  validarRelacionEstudianteGrado,
  validarParcialRelacionEstudianteGrado,
} from "../schemas/rel_estudiantes_grados.js";

export class RelacionEstudianteGradoController {
  static async getAll(req, res) {
    const { anio } = req.query;
    const { seccion } = req.query;
    const filtrado = {};
    if (anio !== undefined) filtrado.anio = Number(anio);
    if (seccion !== undefined) filtrado.seccion = seccion;
    const relacionEstudianteGrado = await RelacionEstudianteGradoModel.getAll({
      filtrado,
    });
    return res.json(relacionEstudianteGrado);
  }

  static async createRelacion(req, res) {
    try {
      const { id_estudiante, id_grado } = req.body;
      console.log(id_estudiante, id_grado);
      if (!id_estudiante || !id_grado) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }
      // Cambio: reporta claramente cuando no hay periodo activo.
      const relacion = await RelacionEstudianteGradoModel.createRelacion({
        id_estudiante,
        id_grado,
      });
      return res.status(201).json(relacion);
    } catch (error) {
      if (error.message === "NO_PERIODO_ACTIVO") {
        return res.status(400).json({
          error: "NO_PERIODO_ACTIVO",
          mensaje: "Debe existir un periodo escolar activo.",
        });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteRelacion(req, res) {
    const { id_estudiante } = req.params;
    console.log(id_estudiante, "ajsisajdisajd");
    const eliminarRelacion = await RelacionEstudianteGradoModel.deleteRelacion({
      id_estudiante: Number(id_estudiante),
    });
    if (!eliminarRelacion) {
      return res.status(404).json({ error: "id_estudiante incorrecta" });
    }
    return res
      .status(200)
      .json({ message: "Relación eliminada correctamente" });
  }

  static async updateRelacion(req, res) {
    const result = validarParcialRelacionEstudianteGrado(req.body);
    const { id } = req.params;
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    try {
      const relacionActualizada =
        await RelacionEstudianteGradoModel.updateRelacion({
          id: Number(id),
          input: result.data,
          preservarNotas: req.body.preservarNotas ?? false,
        });
      if (relacionActualizada === false) {
        return res.status(404).json({ error: "ID no encontrado" });
      }
      return res.json(relacionActualizada);
    } catch (error) {
      return res.status(409).json({ message: error.message });
    }
  }
}
