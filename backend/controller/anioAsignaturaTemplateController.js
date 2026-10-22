import { AnioAsignaturaTemplateModel } from "../models/anioAsignaturaTemplateModel.js";

export class AnioAsignaturaTemplateController {
  static async getByAnio(req, res) {
    const { anio } = req.params;
    const data = await AnioAsignaturaTemplateModel.getByAnio(Number(anio));
    return res.json(data);
  }

  static async add(req, res) {
    const { anio, id_asignatura } = req.body;
    await AnioAsignaturaTemplateModel.add({
      anio: Number(anio),
      id_asignatura: Number(id_asignatura),
    });
    return res.status(201).json({ message: "Asignatura agregada al template" });
  }

  static async remove(req, res) {
    const { anio, id_asignatura } = req.params;
    await AnioAsignaturaTemplateModel.remove({
      anio: Number(anio),
      id_asignatura: Number(id_asignatura),
    });
    return res.json({ message: "Asignatura eliminada del template" });
  }
}
