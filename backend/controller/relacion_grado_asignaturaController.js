import { RelacionGradoAsignaturaModel } from "../models/relacion_grado_asignaturaModel.js";

export class RelacionGradosAsignaturaController {
  static async getAll(req, res) {
    try {
      const { anio } = req.query;
      const obtenerGradosAsignatura = await RelacionGradoAsignaturaModel.getAll(
        {
          anio: anio ? Number(anio) : undefined,
        },
      );
      return res.json(obtenerGradosAsignatura);
    } catch (error) {
      console.error("Error en getAll:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  static async createRelacion(req, res) {
    try {
      const { id_asignatura, anio } = req.body;

      if (id_asignatura === undefined || anio === undefined) {
        return res
          .status(400)
          .json({ message: "Faltan campos requeridos: id_asignatura y anio" });
      }

      const relacion = await RelacionGradoAsignaturaModel.createRelacion({
        id_asignatura: Number(id_asignatura),
        anio: Number(anio),
      });

      if (!relacion) {
        return res
          .status(400)
          .json({ message: "No se pudo crear la relación" });
      }

      return res.status(201).json({
        message: "Relación creada exitosamente",
        data: relacion,
      });
    } catch (error) {
      console.error("Error en createRelacion:", error);
      if (error.message.includes("ya está asignada")) {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  static async deleteRelacion(req, res) {
    try {
      const { anio, asignatura } = req.params;
      console.log(anio, asignatura);

      if (!anio || !asignatura) {
        return res.status(400).json({ message: "Se requiere ambos campos" });
      }

      const result = await RelacionGradoAsignaturaModel.deleteRelacion({
        anio: Number(anio),
        asignatura: asignatura,
      });

      if (!result) {
        return res.status(404).json({ message: "Relación no encontrada" });
      }

      return res.json({ message: "Relación eliminada exitosamente" });
    } catch (error) {
      console.error("Error en deleteRelacion:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }
}
