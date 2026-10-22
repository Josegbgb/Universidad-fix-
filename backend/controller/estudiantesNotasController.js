import { EstudianteNotasModel } from "../models/estudianteNotasModel.js";

export class EstudianteNotasController {
  static async getNotas(req, res) {
    try {
      const userId = req.user.id; // 🔥 viene del JWT
      // Cambio: no se registra el id del usuario autenticado en logs.
      const data = await EstudianteNotasModel.getNotasByUserId({
        userId,
      });

      return res.json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error interno" });
    }
  }

  static async getHistorialByStudentId(req, res) {
    try {
      const { id_estudiante } = req.params;

      const data = EstudianteNotasModel.getHistorialByStudentId({
        id_estudiante,
      });

      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: "Error interno" });
    }
  }

  static async getHistorial(req, res) {
    try {
      const userId = req.user.id;
      const data = EstudianteNotasModel.getHistorialByUserId({ userId });
      return res.json(data);
    } catch (error) {
      return res.status(500).json({ error: "Error interno" });
    }
  }
}
