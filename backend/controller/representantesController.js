import { RepresentantesModel } from "../models/representantesModel.js";
import {
  validarParcialRepresentante,
  validarRepresentante,
} from "../schemas/estudianteSchema.js";

export class RepresentantesController {
  //
  ////Obtener representantes
  //
  static async getAll(req, res) {
    const representantes = await RepresentantesModel.getAll();
    res.json(representantes);
  }
  //
  static async getDeleted(req, res) {
    const eliminados = await RepresentantesModel.getDeleted();
    res.json(eliminados);
  }

  //Obtener por cedula
  //
  static async GetByCedula(req, res) {
    const { cedula } = req.params;
    const representantesPorCedula = await RepresentantesModel.GetByCedula({
      cedula,
    });
    if (!representantesPorCedula || representantesPorCedula.deleted_at) {
      return res
        .status(404)
        .json({ message: "Representante no encontrado, cedula incorrecta" });
    }
    return res.json(representantesPorCedula);
  }
  //
  //Crear representante
  //
  static async createRepresentante(req, res) {
    try {
      const result = validarRepresentante(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: result.error.issues.map((issue) => issue.message) });
      }

      const nuevoRepresentante = await RepresentantesModel.CreateRepresentante({
        input: result.data,
      });
      return res.status(201).json(nuevoRepresentante);
    } catch (error) {
      console.log("🔥 ERROR REPRESENTANTE:", error.message);

      // Manejar errores de UNIQUE
      if (error.message.includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res.status(409).json({
          message: "La cédula ya está registrada en otra persona",
        });
      }

      // Te falta este bloque:
      if (error.message.includes("CORREO_DUPLICADO_EN_TABLA")) {
        return res.status(409).json({
          message: "Ya existe un representante con ese correo",
        });
      }

      if (error.message.includes("CORREO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({
          message: "El correo ya está registrado en otra persona",
        });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({
          message: "El teléfono ya está registrado en otra persona",
        });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_EN_TABLA")) {
        return res.status(409).json({
          message: "Ya existe un representante con ese teléfono",
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
  //
  //Eliminar representante
  //
  static async DeleteRepresentante(req, res) {
    const { id } = req.params;

    const eliminar = await RepresentantesModel.DeleteRepresentante({ id });

    if (!eliminar) {
      return res.status(404).json({
        message: "Representante no encontrado o ya eliminado",
      });
    }

    return res.json({ message: "Representante eliminado correctamente" });
  }
  //

  static async RestoreRepresentante(req, res) {
    const { id } = req.params;

    const restaurado = await RepresentantesModel.RestoreRepresentante({ id });

    if (!restaurado) {
      return res.status(404).json({
        message: "Representante no encontrado",
      });
    }

    return res.json({ message: "Representante restaurado correctamente" });
  }

  // representantesController.js - AGREGAR

  // ELIMINACIÓN DEFINITIVA (HARD DELETE)
  static async hardDeleteRepresentante(req, res) {
    const { id } = req.params;

    try {
      // Eliminar relaciones y representante
      const eliminado = await RepresentantesModel.hardDeleteRepresentante({
        id,
      });

      if (!eliminado) {
        return res.status(404).json({
          message: "Representante no encontrado",
        });
      }

      return res.json({
        message: "Representante eliminado permanentemente",
        id: Number(id),
      });
    } catch (error) {
      console.log("🔥 ERROR HARD DELETE:", error.message);
      return res.status(500).json({
        message: "Error al eliminar representante permanentemente",
        error: error.message,
      });
    }
  }
  //Actualizar
  //
  static async UpdateRepresentante(req, res) {
    const { id } = req.params;
    const result = validarParcialRepresentante(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.issues.map((issue) => issue.message) });
    }
    //
    try {
      const actualizar = await RepresentantesModel.UpdateRepresentante({
        id,
        input: result.data,
      });
      if (!actualizar) {
        return res
          .status(404)
          .json({ message: "ID incorrecto, representante no encontrado" });
      }
      return res.json(actualizar);
    } catch (error) {
      console.log("🔥 ERROR REPRESENTANTE:", error.message);

      // Manejar errores de UNIQUE
      if (error.message.includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res.status(409).json({
          message: "La cédula ya está registrada en otra persona",
        });
      }

      // Te falta este bloque:
      if (error.message.includes("CORREO_DUPLICADO_EN_TABLA")) {
        return res.status(409).json({
          message: "Ya existe un representante con ese correo",
        });
      }

      if (error.message.includes("CORREO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({
          message: "El correo ya está registrado en otra persona",
        });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({
          message: "El teléfono ya está registrado en otra persona",
        });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_EN_TABLA")) {
        return res.status(409).json({
          message: "Ya existe un representante con ese teléfono",
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
}
