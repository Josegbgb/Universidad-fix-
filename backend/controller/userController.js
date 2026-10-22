import { UserModel } from "../models/userModels.js";
import { run, get } from "../src/db.js";
import { jsonResponse } from "../lib/jsonResponse.js";
import jwt from "jsonwebtoken";
import { validarUser } from "../schemas/user.js";
import { validarProfesor } from "../schemas/profesorSchema.js";
import { validarEstudiante } from "../schemas/estudianteSchema.js";
import { validarAdministrador } from "../schemas/administradorSchema.js";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "secret_dev_change_me";
const TOKEN_EXPIRES = "8h";

export class UserController {
  // ======================================
  // 🟩 LOGIN
  // ======================================
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Faltan datos" }));
      }

      // Cambio: no registrar el body de login para no exponer contrasenas.

      // Verificar credenciales
      const result = await UserModel.validateCredentials(email, password);

      if (result?.error === "CORREO_NO_EXISTE") {
        return res
          .status(401)
          .json(jsonResponse(401, { error: "Credenciales incorrectas" }));
      }
      if (result?.error === "USUARIO_ELIMINADO") {
        return res
          .status(403)
          .json(jsonResponse(403, { error: "Usuario eliminado" }));
      }
      if (result?.error === "CONTRASENA_INCORRECTA") {
        return res
          .status(401)
          .json(jsonResponse(401, { error: "Credenciales incorrectas" }));
      }

      const user = result; // ya es el usuario válido

      if (user.activo === 0) {
        return res
          .status(403)
          .json(jsonResponse(403, { error: "Usuario desactivado" }));
      }

      // 🚨 BLOQUEAR LOGIN SI EL PERFIL ESTÁ SOFT DELETED
      if (user.role === "profesor") {
        const profesor = get(
          "SELECT deleted_at FROM profesores WHERE id_usuario = ?",
          [user.id],
        );

        if (!profesor || profesor.deleted_at !== null) {
          return res
            .status(403)
            .json(jsonResponse(403, { error: "Profesor inactivo" }));
        }
      }

      if (user.role === "estudiante") {
        const estudiante = get(
          "SELECT deleted_at FROM estudiantes WHERE id_usuario = ?",
          [user.id],
        );

        if (!estudiante || estudiante.deleted_at !== null) {
          return res
            .status(403)
            .json(jsonResponse(403, { error: "Estudiante inactivo" }));
        }
      }
      if (user.role === "admin") {
        const admin = get(
          "SELECT deleted_at FROM administradores WHERE id_usuario = ?",
          [user.id],
        );
        if (!admin || admin.deleted_at !== null) {
          return res
            .status(403)
            .json(jsonResponse(403, { error: "Administrador inactivo" }));
        }
      }
      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES },
      );

      return res.json(
        jsonResponse(200, {
          user: { id: user.id, email: user.email, role: user.role },
          token,
        }),
      );
    } catch (err) {
      console.error("Error en login:", err);
      return res
        .status(500)
        .json(jsonResponse(500, { error: "Error interno del servidor" }));
    }
  }

  static async listAllUsers(req, res) {
    try {
      const { emailExcluir } = req.query;
      const data = UserModel.getAllWithProfile(emailExcluir || "");
      return res.json(jsonResponse(200, data));
    } catch (err) {
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  // ======================================
  // 🟦 ADMIN CREA USUARIOS (profesor / estudiante / admin)
  // ======================================
  static async registerByAdmin(req, res) {
    try {
      // Cambio: valida solo los campos base para permitir datos de perfil en el mismo body.
      const validation = validarUser({
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        telefono: req.body.telefono,
      });
      if (!validation.success) {
        return res.status(400).json(
          jsonResponse(400, {
            message: "Datos invalidos",
            errors: validation.error.issues,
          }),
        );
      }

      const {
        email,
        role,
        nombre,
        apellido,
        cedula,
        correo,
        telefono,
        direccion,
      } = req.body;
      let adminData = null;

      // ================================
      // ✅ VALIDAR PERFIL ANTES DE CREAR USER
      // ================================

      if (role === "profesor") {
        const valid = validarProfesor({
          nombre,
          apellido,
          cedula,
          correo,
          telefono,
        });

        if (!valid.success) {
          return res
            .status(400)
            .json(jsonResponse(400, { error: valid.error.issues }));
        }
      }

      if (role === "estudiante") {
        const valid = validarEstudiante({
          nombre,
          apellido,
          cedula,
          correo,
          telefono,
        });

        if (!valid.success) {
          return res
            .status(400)
            .json(jsonResponse(400, { error: valid.error.issues }));
        }
      }

      if (role === "admin") {
        const valid = validarAdministrador({
          nombre,
          apellido,
          cedula,
          correo,
          telefono,
          direccion,
        });

        if (!valid.success) {
          return res
            .status(400)
            .json(jsonResponse(400, { error: valid.error.issues }));
        }

        adminData = valid.data;
      }

      // ================================
      // ✅ VERIFICAR EMAIL
      // ================================

      const exists = UserModel.findByEmail(email);
      if (exists) {
        return res
          .status(409)
          .json(jsonResponse(409, { error: "Email ya registrado" }));
      }

      // ================================
      // ✅ CREAR USUARIO
      // ================================

      const tempPassword =
        role === "admin"
          ? String(req.body.password || "Admin123*")
          : String(cedula);

      const user = UserModel.create({
        email,
        password: tempPassword,
        role,
        must_change_password: 1,
      });

      // ================================
      // ✅ CREAR PERFIL SEGÚN ROL
      // ================================

      if (role === "profesor") {
        run(
          `INSERT INTO profesores 
         (nombre, apellido, cedula, correo, telefono, id_usuario)
         VALUES (?,?,?,?,?,?)`,
          [nombre, apellido, cedula, correo, telefono, user.id],
        );
      }

      if (role === "estudiante") {
        run(
          `INSERT INTO estudiantes 
         (nombre, apellido, cedula, correo, telefono, lugar_nacimiento, entidad_federal, id_usuario)
         VALUES (?,?,?,?,?,?,?,?)`,
          [
            nombre,
            apellido,
            cedula,
            correo,
            telefono,
            // Cambio: permite alta administrativa con datos oficiales opcionales.
            req.body.lugar_nacimiento ?? null,
            req.body.entidad_federal ?? null,
            user.id,
          ],
        );
      }

      if (role === "admin") {
        const adminResult = run(
          `INSERT INTO administradores
           (nombre, apellido, cedula, correo, telefono, direccion, id_usuario)
           VALUES (?,?,?,?,?,?,?)`,
          [
            adminData.nombre,
            adminData.apellido,
            adminData.cedula,
            adminData.correo,
            adminData.telefono,
            adminData.direccion,
            user.id,
          ],
        );

        // Cambio: evita usuarios admin sin perfil si falla la insercion del administrador.
        if (adminResult?.error) {
          await UserModel.delete(user.id);
          return res
            .status(409)
            .json(jsonResponse(409, { error: adminResult.error }));
        }
      }

      // ================================
      // ✅ RESPUESTA FINAL
      // ================================

      return res.json(
        jsonResponse(200, {
          message: "Usuario creado correctamente",
          email,
          role,
          password_temporal: tempPassword,
        }),
      );
    } catch (err) {
      console.error("Error en registerByAdmin:", err);
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }
  static async deleteUser(req, res) {
    try {
      const id = Number(req.params.id);
      console.log(id);
      const requester = req.user; // viene del middleware JWT

      const user = UserModel.findById(id);
      if (!user) {
        return res.status(404).json(jsonResponse(404, { error: "No existe" }));
      }

      // 🚨 REGLA CRÍTICA
      if (user.role === "admin" && requester.id !== user.id) {
        return res
          .status(403)
          .json(
            jsonResponse(403, { error: "No puedes modificar otros admins" }),
          );
      }

      UserModel.softDelete(id);

      return res.json(jsonResponse(200, { message: "Usuario eliminado" }));
    } catch (err) {
      console.error("Error deleteUser:", err);
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  static async changePassword(req, res) {
    try {
      const { email, currentPassword, newPassword } = req.body;

      const emailSolicitado = email || req.user?.email;
      // Cambio: un usuario autenticado solo cambia su propia contrasena.
      if (emailSolicitado !== req.user?.email) {
        return res.status(403).json(jsonResponse(403, { error: "Forbidden" }));
      }

      if (!emailSolicitado || !currentPassword || !newPassword) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Faltan datos" }));
      }

      // buscar usuario
      const user = UserModel.findByEmail(emailSolicitado);
      if (!user) {
        return res
          .status(404)
          .json(jsonResponse(404, { error: "Usuario no encontrado" }));
      }

      // validar contraseña actual
      const valid = bcrypt.compareSync(currentPassword, user.password);
      if (!valid) {
        return res
          .status(401)
          .json(jsonResponse(401, { error: "Contraseña actual incorrecta" }));
      }

      // actualizar contraseña
      UserModel.updatePassword(user.id, newPassword);

      return res.json(
        jsonResponse(200, {
          message: "Contraseña actualizada correctamente ✅",
        }),
      );
    } catch (err) {
      console.error("Error en changePassword:", err);
      return res
        .status(500)
        .json(jsonResponse(500, { error: "Error interno del servidor" }));
    }
  }

  static async resetPassword(req, res) {
    try {
      const id = Number(req.params.id);

      const user = UserModel.findById(id);
      if (!user) {
        return res
          .status(404)
          .json(jsonResponse(404, { error: "Usuario no encontrado" }));
      }

      // Obtener cédula del perfil
      const perfil = get(
        `
      SELECT cedula FROM profesores WHERE id_usuario = ?
      UNION
      SELECT cedula FROM estudiantes WHERE id_usuario = ?
      UNION
      SELECT cedula FROM administradores WHERE id_usuario = ?
      `,
        [id, id, id],
      );

      if (!perfil) {
        return res
          .status(404)
          .json(jsonResponse(404, { error: "Perfil no encontrado" }));
      }

      const tempPassword = String(perfil.cedula);

      UserModel.updatePassword(id, tempPassword);

      run(
        `UPDATE usuarios 
       SET must_change_password = 1 
       WHERE id = ?`,
        [id],
      );

      return res.json(
        jsonResponse(200, {
          message: "Contraseña reseteada correctamente",
          password_temporal: tempPassword,
        }),
      );
    } catch (err) {
      console.error("Error resetPassword:", err);
      return res
        .status(500)
        .json(jsonResponse(500, { error: "Error interno del servidor" }));
    }
  }

  static async toggleUserStatus(req, res) {
    try {
      const id = Number(req.params.id);
      const requester = req.user;

      const user = UserModel.findById(id);
      if (!user) {
        return res.status(404).json(jsonResponse(404, { error: "No existe" }));
      }

      // 🚨 REGLA: admin no puede tocar a otro admin
      if (user.role === "admin" && requester.id !== user.id) {
        return res
          .status(403)
          .json(
            jsonResponse(403, { error: "No puedes modificar otros admins" }),
          );
      }

      // 🚨 REGLA PRO: evitar auto-desactivarse
      if (user.role === "admin" && requester.id === user.id) {
        return res.status(403).json(
          jsonResponse(403, {
            error: "Un admin no puede desactivarse a sí mismo",
          }),
        );
      }

      const nuevoEstado = user.activo === 1 ? 0 : 1;

      UserModel.toggleActive(id, nuevoEstado);

      return res.json(jsonResponse(200, { message: "Estado actualizado" }));
    } catch (err) {
      console.error("Error toggleUserStatus:", err);
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }
  ///
  ///
  ///
  // 🔥 OBTENER MI PERFIL
  static async getMyProfile(req, res) {
    try {
      const email = req.query.email || req.user?.email;

      if (!email) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Email requerido" }));
      }
      // Cambio: evita consultar perfiles ajenos con un token valido.
      if (email !== req.user?.email) {
        return res.status(403).json(jsonResponse(403, { error: "Forbidden" }));
      }
      const user = UserModel.findByEmail(email);
      if (!user) {
        return res
          .status(404)
          .json(jsonResponse(404, { error: "Usuario no encontrado" }));
      }
      const profile = UserModel.getProfileByUserId(user.id);

      return res.json(jsonResponse(200, profile));
    } catch (err) {
      console.error("💥 ERROR BACK:", err);
      return res.status(500).json(jsonResponse(500, { error: err.message }));
    }
  }

  // 🔥 ACTUALIZAR MI PERFIL
  static async updateMyProfile(req, res) {
    try {
      const email = req.query.email || req.user?.email;

      // Cambio: evita actualizar perfiles ajenos con un token valido.
      if (email !== req.user?.email) {
        return res.status(403).json(jsonResponse(403, { error: "Forbidden" }));
      }

      const user = UserModel.findByEmail(email);

      if (!user) {
        return res
          .status(404)
          .json(jsonResponse(404, { error: "Usuario no encontrado" }));
      }

      const {
        nombre,
        apellido,
        cedula,
        correo,
        telefono,
        direccion,
        lugar_nacimiento,
        entidad_federal,
      } = req.body;
      const oldEmail = user.email;
      UserModel.updateProfile(user.id, {
        nombre,
        apellido,
        cedula,
        correo,
        telefono,
        direccion,
        // Cambio: conserva datos oficiales del estudiante al editar perfil.
        lugar_nacimiento,
        entidad_federal,
      });
      return res.json(
        jsonResponse(200, {
          message: "Perfil actualizado",
          logout: correo && correo !== oldEmail,
        }),
      );
    } catch (err) {
      console.log(err);

      // 🔥 manejar errores de triggers (UNIQUE)
      if (String(err.message).includes("UNIQUE")) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Dato duplicado" }));
      }

      if (String(err.message).includes("CORREO_DUPLICADO_GLOBAL")) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Correo ya existe" }));
      }

      if (String(err.message).includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Cédula ya existe" }));
      }
      if (String(err.message).includes("TELEFONO_DUPLICADO_GLOBAL")) {
        return res
          .status(400)
          .json(jsonResponse(400, { error: "Teléfono ya existe" }));
      }
      return res
        .status(500)
        .json(jsonResponse(500, { error: "Error actualizando perfil" }));
    }
  }
}
