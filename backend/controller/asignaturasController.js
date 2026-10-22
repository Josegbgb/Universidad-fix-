import { AsignaturasModel } from "../models/asignaturasModel.js";

export class AsignaturasController {
  static async getAllAsignaturas(req, res) {
    const asignaturas = await AsignaturasModel.getAllAsignaturas();
    console.log(asignaturas);
    if (!asignaturas || asignaturas.length === 0) {
      return res.status(200).json([]); // 👈 200 con array vacío
    }
    return res.json(asignaturas);
  }

  static async createAsignatura(req, res) {
    try {
      const { asignatura } = req.body;
      const createAsignatura = await AsignaturasModel.createAsignatura({
        asignatura,
      });
      return res.json(createAsignatura);
    } catch (error) {
      return res.json({
        message: "Ya se encuentra registrada esta asignatura",
      });
    }
  }

  static async deleteAsignatura(req, res) {
    const { id } = req.params;
    const deleteAsignatura = await AsignaturasModel.deleteAsignatura({
      id: Number(id),
    });
    if (deleteAsignatura) {
      return res.json({
        message: "Asignatura eliminada correctamente",
      });
    }
    return res.status(404).json({
      message: "No se encontró la asignatura",
    });
  }

  static async updateAsignatura(req, res) {
    const { id } = req.params;
    const { asignatura } = req.body;
    const updateAsignatura = await AsignaturasModel.updateAsignatura({
      id: Number(id),
      asignatura,
    });
    if (!updateAsignatura) {
      return res.status(404).json({
        message: "No se encontró la asignatura para actualizar",
      });
    }
    return res.json(updateAsignatura);
  }
}
