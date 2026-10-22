import { RelProfesorAsignaturaModel } from "../models/asignaturaProfesorTemplate.js";

export class RelProfesorAsignaturaController {
  // ✅ obtener materias que puede dar el profe
  static async getByProfesor(req, res) {
    const { id_profesor } = req.params;
    console.log("ID del profesor recibido:", id_profesor);
    try {
      const data = await RelProfesorAsignaturaModel.getByProfesor({
        id_profesor: Number(id_profesor),
      });

      return await res.json(data);
    } catch (error) {
      console.error("Error al obtener asignaturas del profesor:", error);
      throw new Error(
        "Error al obtener asignaturas del profesor: " + error.message,
      );
    }
  }

  // ✅ guardar multiselect
  static async assign(req, res) {
    const { id_profesor } = req.params;
    const { asignaturas } = req.body; // array

    if (!Array.isArray(asignaturas)) {
      return res.status(400).json({
        message: "asignaturas debe ser un array",
      });
    }

    await RelProfesorAsignaturaModel.bulkInsert({
      id_profesor: Number(id_profesor),
      asignaturas,
    });

    return res.json({ message: "Asignaturas guardadas" });
  }

  // 🔥 sync completo (para editar multiselect)
  static async sync(req, res) {
    const { id_profesor } = req.params;
    const { asignaturas } = req.body;

    if (!Array.isArray(asignaturas)) {
      return res.status(400).json({
        message: "asignaturas debe ser un array",
      });
    }

    await RelProfesorAsignaturaModel.syncAsignaturas({
      id_profesor: Number(id_profesor),
      asignaturas,
    });

    return res.json({ message: "Asignaturas actualizadas" });
  }
}
