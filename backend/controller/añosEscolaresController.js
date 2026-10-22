import { AñosEscolaresModel } from "../models/añosEscolaresModels.js";
import { validarGrado, validarGradoParcial } from "../schemas/añosSchemas.js";

export class añosEscolaresController {
  static async getAll(req, res) {
    const { anio } = req.query;
    const { seccion } = req.query;
    const { incluirInactivos } = req.query;

    const filtrado = {};
    if (anio !== undefined) filtrado.anio = Number(anio);
    if (seccion !== undefined) filtrado.seccion = seccion;
    // Cambio: ?incluirInactivos=true devuelve tambien los grados deshabilitados.
    if (incluirInactivos === "true") filtrado.incluirInactivos = true;
    const añosEscolares = await AñosEscolaresModel.getAll(filtrado);
    return res.json(añosEscolares);
  }
  //
  // Cambio: grados deshabilitados
  //
  static async getDisabled(req, res) {
    try {
      const deshabilitados = await AñosEscolaresModel.getDisabled();
      return res.json(deshabilitados);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
  //
  //crear nuevo grado
  //
  static async createGrado(req, res) {
    const result = validarGrado(req.body);
    if (result.error) {
      return res
        .status(400)
        .json({ error: result.error.flatten().fieldErrors });
    }
    try {
      const nuevoGrado = await AñosEscolaresModel.createGrade({
        input: result.data,
      });
      return res.status(201).json(nuevoGrado);
    } catch (error) {
      return res.status(400).json({ Message: error.message });
    }
  }

  static async deleteGrade(req, res) {
    const { id } = req.params;
    try {
      const eliminar = await AñosEscolaresModel.deleteGrade({ id: Number(id) });
      if (eliminar) {
        return res.json({ message: "Eliminado correctamente" });
      }
      return res.status(400).json({ message: "No encontrado" });
    } catch (error) {
      if (error.message === "GRADO_CON_NOTAS") {
        return res.status(409).json({
          message: "No se puede eliminar un grado que tiene notas registradas",
        });
      }
      return res.status(500).json({ message: error.message });
    }
  }
  //
  // Cambio: deshabilitar grado
  //
  static async disableGrade(req, res) {
    const { id } = req.params;
    try {
      const ok = await AñosEscolaresModel.disableGrade({ id: Number(id) });
      if (ok) {
        return res.json({ message: "Grado deshabilitado correctamente" });
      }
      return res.status(400).json({ message: "No encontrado" });
    } catch (error) {
      if (error.message === "GRADO_NO_ENCONTRADO") {
        return res.status(404).json({ message: "Grado no encontrado" });
      }
      if (error.message === "GRADO_YA_DESHABILITADO") {
        return res
          .status(409)
          .json({ message: "El grado ya está deshabilitado" });
      }
      if (error.message === "GRADO_CON_ESTUDIANTES") {
        return res.status(409).json({
          message:
            "Este grado tiene estudiantes. Cámbielos de sección antes de deshabilitarlo",
        });
      }
      return res.status(500).json({ message: error.message });
    }
  }
  //
  // Cambio: habilitar grado
  //
  static async enableGrade(req, res) {
    const { id } = req.params;
    try {
      const ok = await AñosEscolaresModel.enableGrade({ id: Number(id) });
      if (ok) {
        return res.json({ message: "Grado habilitado correctamente" });
      }
      return res.status(400).json({ message: "No encontrado" });
    } catch (error) {
      if (error.message === "GRADO_NO_ENCONTRADO") {
        return res.status(404).json({ message: "Grado no encontrado" });
      }
      if (error.message === "GRADO_YA_HABILITADO") {
        return res.status(409).json({ message: "El grado ya está habilitado" });
      }
      return res.status(500).json({ message: error.message });
    }
  }
  //
  //
  //
  //
  static async updateGrade(req, res) {
    //
    //
    const { id } = req.params;
    const result = validarGradoParcial(req.body);
    try {
      const actualizar = await AñosEscolaresModel.updateGrade({
        id: Number(id),
        input: result.data,
      });
      if (actualizar) {
        return res.json(actualizar);
      }
      return res.status(400).json({ message: "No encontrado" });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
    //
    //
  }
}