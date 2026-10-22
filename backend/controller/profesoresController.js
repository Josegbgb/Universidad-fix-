import { ProfesoresModel } from "../models/profesoresModels.js";
import { relacion_asignatura_profesorModel } from "../models/relacion_asignatura_profesor_model.js";
import {
  validarProfesor,
  validarParcialProfesor,
} from "../schemas/profesorSchema.js";
import { UserModel } from "../models/userModels.js";
import { get } from "../src/db.js";
//
///
//
export class ProfesoresController {
  static async getAll(req, res) {
    const { nombre } = req.query;
    const { apellido } = req.query;
    const filtrado = {};
    if (nombre !== undefined) filtrado.nombre = nombre;
    if (apellido !== undefined) filtrado.apellido = apellido;
    const profesores = await ProfesoresModel.getAll({ filtrado });
    return res.json(profesores);
  }

  static async getDeleted(req, res) {
    const eliminados = await ProfesoresModel.getDeleted();
    res.json(eliminados);
  }

  static async getById(req, res) {
    const { id } = req.params;

    const profesor = await ProfesoresModel.getById({
      id_profesor: Number(id),
    });

    if (!profesor) {
      return res.status(404).json({ message: "Profesor no encontrado" });
    }

    return res.json(profesor);
  }
  //
  ///
  //
  static async getByCedula(req, res) {
    const { cedula } = req.params;
    const obtenerProfesor = await ProfesoresModel.getByCedula({
      cedula: Number(cedula),
    });
    if (obtenerProfesor) {
      return res.json(obtenerProfesor);
    }
    return res.status(404).json({ message: "Profesor no encontrado" });
  }

  // profesoresController.js - VERSIÓN CORREGIDA
  //
  ///
  //
  static async createProfesor(req, res) {
    const result = validarProfesor(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((issue) => issue.message),
      });
    }

    const { nombre, apellido, cedula, correo, telefono, direccion } =
      result.data;

    try {
      // ✅ 1. Verificar cédula
      const profesorExistente = await ProfesoresModel.getByCedula({ cedula });
      if (profesorExistente && profesorExistente.deleted_at === null) {
        return res
          .status(409)
          .json({ message: "Ya existe un profesor con esa cédula" });
      }

      const tempPassword = String(cedula);

      // ✅ 2. Crear usuario (primero, fuera de transacción compleja)
      const userExistente = await UserModel.findByEmail(correo);
      if (userExistente) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado" });
      }

      const user = UserModel.create({
        email: correo,
        password: tempPassword,
        role: "profesor",
        must_change_password: 1,
      });

      // ✅ 3. Crear profesor (esto puede lanzar error por teléfono duplicado)
      try {
        const profesor = await ProfesoresModel.createProfesor({
          input: {
            nombre,
            apellido,
            cedula,
            correo,
            telefono,
            direccion,
            id_usuario: user.id,
          },
        });

        return res.status(201).json({
          profesor,
          credenciales: {
            email: correo,
            password_temporal: tempPassword,
          },
        });
      } catch (profesorError) {
        // Si falla crear profesor, eliminar el usuario creado (rollback manual)
        await UserModel.delete(user.id);
        throw profesorError; // Re-lanzar para manejarlo abajo
      }
    } catch (error) {
      console.log("🔥 ERROR REAL:", error.message);

      // Manejar todos los tipos de error
      if (error.message.includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res
          .status(409)
          .json({ message: "La cédula ya está registrada" });
      }

      if (error.message.includes("USER_EMAIL_DUPLICADO")) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado" });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res
          .status(409)
          .json({ message: "El teléfono ya está registrado en otra persona" });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_EN_TABLA")) {
        return res
          .status(409)
          .json({ message: "Ya existe un profesor con ese teléfono" });
      }

      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }

  //
  ///
  //
  static async getAllWithCapacidades(req, res) {
    try {
      const profesores = await ProfesoresModel.getAllWithCapacidades();
      return res.json(profesores);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al obtener profesores" });
    }
  }
  static async deleteProfesor(req, res) {
    const { id } = req.params;

    const profesor = get("SELECT id_usuario FROM profesores WHERE id = ?", [
      id,
    ]);

    await relacion_asignatura_profesorModel.deleteByProfesor({
      id_profesor: Number(id),
    });

    const eliminarProfesor = await ProfesoresModel.deleteProfesor({ id });

    if (eliminarProfesor) {
      // 👈 faltaba esto
      if (profesor?.id_usuario) {
        await UserModel.softDelete(profesor.id_usuario);
      }
      return res.json({ message: "Profesor eliminado" });
    }
    return res.status(404).json({ message: "Profesor no encontrado" });
  }

  static async RestoreProfesor(req, res) {
    const { id } = req.params;
    const profesor = get("SELECT id_usuario FROM profesores WHERE id = ?", [
      id,
    ]);

    const restaurado = await ProfesoresModel.restoreProfesor({ id });

    if (!restaurado) {
      return res.status(404).json({ message: "Profesor no encontrado" });
    }

    // 👈 faltaba esto
    if (profesor?.id_usuario) {
      await UserModel.restore(profesor.id_usuario);
    }

    return res.json({ message: "Profesor restaurado correctamente" });
  }
  //
  ///
  //

  static async updateProfesor(req, res) {
    const { id } = req.params;
    const result = validarParcialProfesor(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((issue) => issue.message),
      });
    }
    try {
      const profesorActual = await ProfesoresModel.getById({
        id_profesor: Number(id),
      });

      const actualizarProfesor = await ProfesoresModel.updateProfesor({
        id: Number(id),
        input: result.data,
      });
      if (!actualizarProfesor) {
        return res.status(404).json({ message: "Profesor no encontrado" });
      }
      if (result.data.correo && result.data.correo !== profesorActual.correo) {
        UserModel.updateEmail(profesorActual.id_usuario, result.data.correo);
      }
      return res.json(actualizarProfesor);
    } catch (error) {
      console.log("🔥 ERROR REAL:", error.message);

      // Manejar todos los tipos de error
      if (error.message.includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res
          .status(409)
          .json({ message: "La cédula ya está registrada" });
      }

      if (error.message.includes("CORREO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({ message: "Correo ya registrado" });
      }

      if (error.message.includes("USER_EMAIL_DUPLICADO")) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado" });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res
          .status(409)
          .json({ message: "El teléfono ya está registrado en otra persona" });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_EN_TABLA")) {
        return res
          .status(409)
          .json({ message: "Ya existe un profesor con ese teléfono" });
      }

      return res.status(500).json({ message: "Error interno del servidor" });
    }
  }
}
