import { RelacionEstudianteRepresentanteModel } from "../models/relacion_estudiante_representantes.js";

export class RelacionEstudiantesRepresentantesController {
  // =========================
  // OBTENER REPRESENTANTES DE UN ESTUDIANTE
  // =========================
  static async getAll(req, res) {
    try {
      const { id_estudiante } = req.query;

      // Si no viene id_estudiante, se pasa undefined y el modelo trae todos
      const relaciones =
        await RelacionEstudianteRepresentanteModel.getByEstudiante({
          id_estudiante: id_estudiante ? Number(id_estudiante) : undefined,
        });

      return res.json(relaciones);
    } catch (error) {
      console.error("Error en getAll:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  // =========================
  // CREAR RELACIÓN
  // =========================
  static async createRelacion(req, res) {
    try {
      const { id_estudiante, id_representante, parentesco } = req.body;

      if (
        id_estudiante === undefined ||
        id_representante === undefined ||
        !parentesco
      ) {
        return res.status(400).json({
          message:
            "Faltan campos requeridos: id_estudiante, id_representante y parentesco",
        });
      }

      const relacion =
        await RelacionEstudianteRepresentanteModel.createRelacion({
          id_estudiante: Number(id_estudiante),
          id_representante: Number(id_representante),
          parentesco: parentesco.trim(),
        });

      return res.status(201).json({
        message: "Relación creada exitosamente",
        data: relacion,
      });
    } catch (error) {
      console.error("Error en createRelacion:", error);

      if (error.message.includes("ya está asignado")) {
        return res.status(409).json({ message: error.message });
      }

      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  // =========================
  // ELIMINAR RELACIÓN
  // =========================
  static async deleteRelacion(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          message: "El id de la relación es requerido",
        });
      }

      const result = await RelacionEstudianteRepresentanteModel.deleteRelacion({
        id: Number(id),
      });

      if (!result) {
        return res.status(404).json({
          message: "Relación no encontrada",
        });
      }

      return res.json({
        message: "Relación eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error en deleteRelacion:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  static async updateRelacion(req, res) {
    try {
      const { id } = req.params;
      const { id_estudiante, id_representante, parentesco } = req.body;

      if (!id_estudiante && !id_representante && !parentesco) {
        return res.status(400).json({
          message: "No se ha proporcionado ninguna actualización",
        });
      }

      // Actualiza solo los campos que son proporcionados
      const updateData = {};
      if (id_estudiante) updateData.id_estudiante = Number(id_estudiante);
      if (id_representante)
        updateData.id_representante = Number(id_representante);
      if (parentesco) updateData.parentesco = parentesco;

      const result = await RelacionEstudianteRepresentanteModel.updateRelacion({
        id: Number(id),
        input: updateData,
      });

      if (!result) {
        return res.status(404).json({
          message: "No se pudo actualizar la relación, verifique los datos.",
        });
      }

      return res.status(200).json({
        message: "Relación actualizada exitosamente",
        data: result,
      });
    } catch (error) {
      console.error("Error en updateRelacion:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }
}
