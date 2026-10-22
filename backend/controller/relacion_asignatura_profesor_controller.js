import { relacion_asignatura_profesorModel } from "../models/relacion_asignatura_profesor_model.js";

export class Relacion_asignatura_profesor {
  static async getAll(req, res) {
    try {
      const result = await relacion_asignatura_profesorModel.getAll();
      return res.json(result);
    } catch (error) {
      console.log(error);
    }
  }

  static async getById(req, res) {
    try {
      const { id_profesor } = req.params;
      if (!id_profesor) {
        return res.status(400).json({ message: "No encontrado" });
      }
      const resultId = await relacion_asignatura_profesorModel.getByid({
        id_profesor: Number(id_profesor),
      });
      if (resultId) {
        return res.json(resultId);
      }
    } catch (error) {}
  }

  static async createRel(req, res) {
    try {
      const { id_rel_grado_asignatura, id_profesor } = req.body;
      if (!id_rel_grado_asignatura || !id_profesor) {
        return res.status(400).json({ message: "Se necesitan los dos campos" });
      }
      const createRel = await relacion_asignatura_profesorModel.create({
        id_rel_grado_asignatura: Number(id_rel_grado_asignatura),
        id_profesor: Number(id_profesor),
      });
      if (createRel) {
        return res.json(createRel);
      }
      return res
        .status(404)
        .json({ message: "Error al crear la relacion, datos incorrectos" });
    } catch (error) {
      return res.json({ message: error });
    }
  }

  static async deleteRel(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res(404).json({
          message: "Se necesita un id para eliminar la relacion",
        });
      }
      const deleteRel = await relacion_asignatura_profesorModel.delete({
        id: Number(id),
      });
      console.log(deleteRel);
      if (deleteRel) {
        return res.json({ message: "Eliminado correctamente" });
      }
      return res
        .status(400)
        .json({ message: "No se encontro relacion por esa id" });
    } catch (error) {
      return res.json({ message: error });
    }
  }

  //////////
  static async deleteByProfesor(req, res) {
    try {
      const { id_profesor } = req.params;

      if (!id_profesor) {
        return res.status(400).json({
          message: "Se requiere el id del profesor",
        });
      }

      const eliminadas =
        await relacion_asignatura_profesorModel.deleteByProfesor({
          id_profesor: Number(id_profesor),
        });

      return res.json({
        message: "Relaciones eliminadas correctamente",
        relaciones_eliminadas: eliminadas,
      });
    } catch (error) {
      return res.status(500).json({
        message: "Error al eliminar relaciones del profesor",
        error: error.message,
      });
    }
  }
}
