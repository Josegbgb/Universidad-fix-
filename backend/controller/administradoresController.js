import { AdministradoresModel } from "../models/administradoresModel.js";
import {
  validarAdministrador,
  validarParcialAdministrador,
} from "../schemas/administradorSchema.js";
import { UserModel } from "../models/userModels.js";

export class AdministradoresController {
  static async getAll(req, res) {
    const { nombre, apellido, emailExcluir } = req.query;
    const filtrado = {};
    if (nombre !== undefined) filtrado.nombre = nombre;
    if (apellido !== undefined) filtrado.apellido = apellido;

    const admins = await AdministradoresModel.getAll({
      filtrado,
      emailExcluir: emailExcluir || "", // 👈
    });
    return res.json(admins);
  }

  static async getDeleted(req, res) {
    const eliminados = await AdministradoresModel.getDeleted();
    res.json(eliminados);
  }

  static async getByCedula(req, res) {
    const { cedula } = req.params;

    const admin = await AdministradoresModel.getByCedula({
      cedula: Number(cedula),
    });

    if (!admin) {
      return res.status(404).json({ message: "Administrador no encontrado" });
    }

    return res.json(admin);
  }

  static async createAdministrador(req, res) {
    const result = validarAdministrador(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((i) => i.message),
      });
    }
    const { nombre, apellido, cedula, correo, telefono, direccion } =
      result.data;
    try {
      // 🔍 verificar admin existente
      const existente = await AdministradoresModel.getByCedula({ cedula });

      if (existente && existente.deleted_at === null) {
        return res.status(409).json({
          message: "Ya existe un administrador con esa cédula",
        });
      }

      // 🔍 verificar usuario
      const email = correo;
      const userExistente = await UserModel.findByEmail(email);

      if (userExistente) {
        return res.status(409).json({
          message: "Ya existe un usuario con este correo",
        });
      }

      // 🔐 crear usuario
      const tempPassword = String(cedula);

      const user = UserModel.create({
        email,
        password: tempPassword,
        role: "admin",
        must_change_password: 1,
      });

      // 👤 crear administrador
      try {
        const admin = await AdministradoresModel.createAdministrador({
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
          administrador: admin,
          credenciales: {
            email: correo,
            password_temporal: tempPassword,
          },
        });
      } catch (adminError) {
        // 🔥 rollback si falla el admin
        await UserModel.delete(user.id);
        throw adminError;
      }
    } catch (error) {
      console.log("🔥 ERROR REAL:", error.message);

      if (error.message.includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res.status(409).json({
          message: "La cédula ya está registrada",
        });
      }

      if (error.message.includes("USER_EMAIL_DUPLICADO")) {
        return res.status(409).json({
          message: "El correo ya está registrado",
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
          message: "Ya existe un administrador con ese teléfono",
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }

  static async deleteAdministrador(req, res) {
    const { id } = req.params;

    const eliminado = await AdministradoresModel.deleteAdministrador({ id });

    if (!eliminado) {
      return res.status(404).json({
        message: "Administrador no encontrado",
      });
    }

    return res.json({ message: "Administrador eliminado" });
  }

  static async restoreAdministrador(req, res) {
    const { id } = req.params;

    const ok = await AdministradoresModel.restoreAdministrador({ id });

    if (!ok) {
      return res.status(404).json({
        message: "Administrador no encontrado",
      });
    }

    return res.json({ message: "Administrador restaurado" });
  }

  static async updateAdministrador(req, res) {
    const { id } = req.params;

    const result = validarParcialAdministrador(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues.map((i) => i.message),
      });
    }
    try {
      const adminActual = await AdministradoresModel.getById({
        id_administrador: Number(id),
      });

      if (!adminActual) {
        return res
          .status(404)
          .json({ message: "ID incorrecto, estudiante no encontrado" });
      }
      const actualizado = await AdministradoresModel.updateAdministrador({
        id: Number(id),
        input: result.data,
      });
      if (result.data.correo && result.data.correo !== adminActual.correo) {
        await UserModel.updateEmail(adminActual.id_usuario, result.data.correo);
      }
      return res.json(actualizado);
    } catch (error) {
      console.log("🔥 ERROR REAL:", error.message);

      if (error.message.includes("CEDULA_DUPLICADA_GLOBAL")) {
        return res.status(409).json({
          message: "La cédula ya está registrada",
        });
      }

      if (error.message.includes("USER_EMAIL_DUPLICADO")) {
        return res.status(409).json({
          message: "El correo ya está registrado",
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
          message: "Ya existe un administrador con ese teléfono",
        });
      }

      return res.status(500).json({
        message: "Error interno del servidor",
      });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    const admin = await AdministradoresModel.getById({
      id_administrador: Number(id),
    });

    if (!admin) {
      return res.status(404).json({
        message: "Administrador no encontrado",
      });
    }

    return res.json(admin);
  }
}
