import { EstudiantesModel } from "../models/estudianteModels.js";
import { relacion_asignatura_profesorModel } from "../models/relacion_asignatura_profesor_model.js";
import { RelacionEstudianteGradoModel } from "../models/relacion_estudiante_grado.js";
import {
  validarEstudiante,
  validarParcialEstudiante,
} from "../schemas/estudianteSchema.js";
import { UserModel } from "../models/userModels.js";
import { all, run, get } from "../src/db.js"; // Cambio: RestoreStudent usa all().
export class EstudiantesController {
  //
  ////Obtener estudiantes
  //
  static async getAll(req, res) {
    const estudiantes = await EstudiantesModel.getAll();
    res.json(estudiantes);
  }
  //
  static async getDeleted(req, res) {
    const eliminados = await EstudiantesModel.getDeleted();
    res.json(eliminados);
  }

  static async getEgresados(req, res) {
    const egresados = await EstudiantesModel.getEgresados();
    res.json(egresados);
  }
  //Obtener por cedula
  //
  static async GetByCedula(req, res) {
    const { cedula } = req.params;
    const estudiantePorCedula = await EstudiantesModel.GetByCedula({ cedula });
    if (!estudiantePorCedula || estudiantePorCedula.deleted_at) {
      return res
        .status(404)
        .json({ message: "Estudiante no encontrado, cedula incorrecta" });
    }
    return res.json(estudiantePorCedula);
  }
  //
  //Crear estudiante
  //
  static async createStudent(req, res) {
    const result = validarEstudiante(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((issue) => issue.message),
      });
    }

    const {
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      lugar_nacimiento,
      entidad_federal,
    } = result.data;

    try {
      // ✅ 1. Verificar cédula (igual que profesor)
      const estudianteExistente = await EstudiantesModel.GetByCedula({
        cedula,
      });

      if (estudianteExistente && estudianteExistente.deleted_at === null) {
        return res
          .status(409)
          .json({ message: "Ya existe un estudiante con esa cédula" });
      }

      const tempPassword = String(cedula);

      // ✅ 2. Verificar email antes de crear usuario
      const userExistente = await UserModel.findByEmail(correo);
      if (userExistente) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado" });
      }

      // ✅ 3. Crear usuario primero
      const user = UserModel.create({
        email: correo,
        password: tempPassword,
        role: "estudiante",
        must_change_password: 1,
      });

      // ✅ 4. Crear estudiante (puede fallar por teléfono)
      try {
        const estudiante = await EstudiantesModel.CreateStudent({
          input: {
            nombre,
            apellido,
            cedula,
            correo,
            telefono,
            // Cambio: datos oficiales de nacimiento para planillas.
            lugar_nacimiento,
            entidad_federal,

            id_usuario: user.id,
          },
        });

        return res.status(201).json({
          estudiante,
          credenciales: {
            email: correo,
            password_temporal: tempPassword,
          },
        });
      } catch (estudianteError) {
        // 🔥 ROLLBACK MANUAL (CLAVE)
        await UserModel.delete(user.id);
        throw estudianteError;
      }
    } catch (error) {
      console.log("🔥 ERROR REAL:", error.message);

      // ✅ mismos mapeos que profesores
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

      if (error.message.includes("CORREO_DUPLICADO_GLOBAL")) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado en otra persona" });
      }
      if (error.message.includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({
          message: "El teléfono ya está registrado en otra persona",
        });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_EN_TABLA")) {
        return res.status(409).json({
          message: "Ya existe un estudiante con ese teléfono",
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }

  //
  //Eliminar estudiante
  //
  static async DeleteStudent(req, res) {
    const { id } = req.params;

    try {
      const data = get("SELECT id_usuario FROM estudiantes WHERE id = ?", [id]);

      // Cambio: soft delete solo de la relacion del periodo activo.
      run(
        `UPDATE rel_estudiante_grado 
       SET activo = 0, deleted_at = CURRENT_TIMESTAMP 
       WHERE id_estudiante = ?
       AND id_periodo = (SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1)
       AND activo = 1 AND deleted_at IS NULL`,
        [id],
      );

      const eliminado = await EstudiantesModel.DeleteStudent({ id });

      if (!eliminado) {
        return res
          .status(404)
          .json({ message: "Estudiante no encontrado o ya eliminado" });
      }

      // soft delete usuario
      if (data?.id_usuario) {
        await UserModel.softDelete(data.id_usuario);
      }

      // 👇 soft delete representante si no tiene otros hijos activos
      const representantes = get(
        `SELECT id_representante FROM rel_estudiante_representante WHERE id_estudiante = ?`,
        [id],
      );

      if (representantes) {
        const repIds = Array.isArray(representantes)
          ? representantes
          : [representantes];
        for (const rep of repIds) {
          const otrosHijos = get(
            `SELECT 1 FROM rel_estudiante_representante rer
           INNER JOIN estudiantes e ON e.id = rer.id_estudiante
           WHERE rer.id_representante = ? AND e.deleted_at IS NULL AND rer.id_estudiante != ?`,
            [rep.id_representante, id],
          );
          if (!otrosHijos) {
            run(
              `UPDATE representantes SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
              [rep.id_representante],
            );
          }
        }
      }

      return res.json({ message: "Estudiante eliminado correctamente" });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error interno", error: error.message });
    }
  }
  //

  static async RestoreStudent(req, res) {
    const { id } = req.params;

    try {
      const data = get("SELECT id_usuario FROM estudiantes WHERE id = ?", [id]);

      const restaurado = await EstudiantesModel.RestoreStudent({ id });

      if (!restaurado) {
        return res.status(404).json({ message: "Estudiante no encontrado" });
      }

      // restaurar usuario
      if (data?.id_usuario) {
        await UserModel.restore(data.id_usuario);
      }

      // Cambio: restaurar rel_estudiante_grado del periodo activo.
      run(
        `UPDATE rel_estudiante_grado 
       SET activo = 1, deleted_at = NULL 
       WHERE id = (
         SELECT id FROM rel_estudiante_grado 
         WHERE id_estudiante = ?
         AND id_periodo = (SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1)
         ORDER BY deleted_at DESC LIMIT 1
       )`,
        [id],
      );

      // 👇 restaurar representantes que estaban eliminados por este estudiante
      const representantes = all(
        `SELECT id_representante FROM rel_estudiante_representante WHERE id_estudiante = ?`,
        [id],
      );

      for (const rep of representantes) {
        run(
          `UPDATE representantes SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL`,
          [rep.id_representante],
        );
      }

      return res.json({ message: "Estudiante restaurado correctamente" });
    } catch (error) {
      return res.status(500).json({ message: "Error", error: error.message });
    }
  }

  // estudianteController.js - AGREGAR

  // ELIMINACIÓN DEFINITIVA (HARD DELETE) - Estudiante + Usuario
  static async hardDeleteStudent(req, res) {
    const { id } = req.params;

    try {
      // Obtener ID de usuario antes de eliminar
      const userId = await EstudiantesModel.getUserIdByStudentId({ id });

      // Eliminar estudiante y sus relaciones
      const eliminado = await EstudiantesModel.hardDeleteStudent({ id });

      if (!eliminado) {
        return res.status(404).json({
          message: "Estudiante no encontrado",
        });
      }

      // ✅ ELIMINAR USUARIO ASOCIADO (si existe)
      if (userId) {
        run(`DELETE FROM usuarios WHERE id = ?`, [userId]);
      }

      return res.json({
        message: "Estudiante y usuario eliminados permanentemente",
        id: Number(id),
      });
    } catch (error) {
      console.log("🔥 ERROR HARD DELETE:", error.message);
      return res.status(500).json({
        message: "Error al eliminar estudiante permanentemente",
        error: error.message,
      });
    }
  }

  //Actualizar
  //
  static async UpdateStudent(req, res) {
    const { id } = req.params;
    const result = validarParcialEstudiante(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: result.error.issues.map((issue) => issue.message) });
    }
    //
    try {
      const estudianteActual = await EstudiantesModel.getById({
        id_estudiante: Number(id),
      });

      if (!estudianteActual) {
        return res
          .status(404)
          .json({ message: "ID incorrecto, estudiante no encontrado" });
      }
      const actualizar = await EstudiantesModel.UpdateStudent({
        id,
        input: result.data,
      });
      if (
        result.data.correo &&
        result.data.correo !== estudianteActual.correo
      ) {
        await UserModel.updateEmail(
          estudianteActual.id_usuario,
          result.data.correo,
        );
      }
      return res.json(actualizar);
    } catch (error) {
      console.log("🔥 ERROR REAL:", error.message);

      // ✅ mismos mapeos que profesores
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

      if (error.message.includes("CORREO_DUPLICADO_GLOBAL")) {
        return res
          .status(409)
          .json({ message: "El correo ya está registrado en otra persona" });
      }
      if (error.message.includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res.status(409).json({
          message: "El teléfono ya está registrado en otra persona",
        });
      }

      if (error.message.includes("TELEFONO_DUPLICADO_EN_TABLA")) {
        return res.status(409).json({
          message: "Ya existe un estudiante con ese teléfono",
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }
}
