import { get, run, all } from "../src/db.js";

import bcrypt from "bcryptjs";

export class UserModel {
  static create({ email, password, role, must_change_password = 1 }) {
    const hashed = bcrypt.hashSync(password, 10);

    const info = run(
      `INSERT INTO usuarios (email, password, role, must_change_password)
     VALUES (?, ?, ?, ?)`,
      [email, hashed, role, must_change_password],
    );

    return { id: info.lastInsertRowid, email, role };
  }

  static getAllWithProfile(emailExcluir = "") {
    const params = [];
    let whereExtra = "";
    if (emailExcluir) {
      whereExtra = "AND u.email != ?";
      params.push(emailExcluir);
    }

    return all(
      `
    SELECT u.id, u.email, u.role, u.activo, u.created_at,
      COALESCE(p.nombre, e.nombre, a.nombre) AS nombre,
      COALESCE(p.apellido, e.apellido, a.apellido) AS apellido,
      COALESCE(p.cedula, e.cedula, a.cedula) AS cedula
    FROM usuarios u
    LEFT JOIN profesores p ON p.id_usuario = u.id
    LEFT JOIN estudiantes e ON e.id_usuario = u.id
    LEFT JOIN administradores a ON a.id_usuario = u.id
    WHERE u.deleted_at IS NULL ${whereExtra}
    ORDER BY u.id DESC
  `,
      params,
    );
  }

  static findByEmail(email) {
    return get("SELECT * FROM usuarios WHERE email = ?", [email]);
  }
  static updateEmail(id, email) {
    return run(
      `UPDATE usuarios 
     SET email = ? 
     WHERE id = ?`,
      [email, id],
    );
  }
  static findById(id) {
    return get("SELECT * FROM usuarios WHERE id = ?", [id]);
  }

  static updatePassword(id, newPassword) {
    const hashed = bcrypt.hashSync(newPassword, 10);
    return run("UPDATE usuarios SET password = ? WHERE id = ?", [hashed, id]);
  }

  static validateCredentials(email, password) {
    const user = this.findByEmail(email);
    if (!user) return { error: "CORREO_NO_EXISTE" };
    if (user.deleted_at !== null) return { error: "USUARIO_ELIMINADO" };

    const ok = bcrypt.compareSync(String(password), user.password);
    if (!ok) return { error: "CONTRASENA_INCORRECTA" };
    return user;
  }

  static softDelete(id) {
    return run(
      `UPDATE usuarios 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
      [id],
    );
  }

  static restore(id) {
    return run(
      `UPDATE usuarios 
     SET deleted_at = NULL 
     WHERE id = ?`,
      [id],
    );
  }

  // userModels.js
  static async delete(id) {
    const sql = "DELETE FROM usuarios WHERE id = ?";
    const result = run(sql, [id]);
    return result.changes > 0;
  }

  static toggleActive(id, activo) {
    return run(`UPDATE usuarios SET activo = ? WHERE id = ?`, [activo, id]);
  }
  //
  //
  //
  // 🔥 OBTENER PERFIL COMPLETO POR ID
  static getProfileByUserId(id) {
    return get(
      `
    SELECT 
      u.id,
      u.email,
      u.role,

      COALESCE(p.nombre, e.nombre, a.nombre) AS nombre,
      COALESCE(p.apellido, e.apellido, a.apellido) AS apellido,
      COALESCE(p.cedula, e.cedula, a.cedula) AS cedula,
      COALESCE(p.correo, e.correo, a.correo) AS correo,
      COALESCE(p.telefono, e.telefono, a.telefono) AS telefono,
      e.lugar_nacimiento,
      e.entidad_federal,
      COALESCE(p.direccion, a.direccion, NULL) AS direccion

    FROM usuarios u
    LEFT JOIN profesores p ON p.id_usuario = u.id
    LEFT JOIN estudiantes e ON e.id_usuario = u.id
    LEFT JOIN administradores a ON a.id_usuario = u.id

    WHERE u.id = ?
  `,
      [id],
    );
  }

  // 🔥 ACTUALIZAR PERFIL COMPLETO
  static updateProfile(id, data) {
    const current = this.getProfileByUserId(id);

    const changed = {};
    for (const key of [
      "nombre",
      "apellido",
      "cedula",
      "correo",
      "telefono",
      "lugar_nacimiento",
      "entidad_federal",
      "direccion",
    ]) {
      if (
        data[key] !== undefined &&
        String(data[key]) !== String(current[key] ?? "")
      ) {
        changed[key] = data[key];
      }
    }
    const {
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      lugar_nacimiento,
      entidad_federal,
      direccion,
    } = {
      ...current, // base: valores actuales
      ...changed, // encima: solo los que cambiaron
    };

    const user = this.findById(id);
    if (changed.correo) {
      const correoExists = get(
        `
      SELECT 1 FROM profesores WHERE correo = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM estudiantes WHERE correo = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM administradores WHERE correo = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM representantes WHERE correo = ?
      `,
        [correo, id, correo, id, correo, id, correo],
      );
      if (correoExists) throw new Error("CORREO_DUPLICADO_GLOBAL");
    }

    if (changed.cedula) {
      const cedulaExists = get(
        `
      SELECT 1 FROM profesores WHERE cedula = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM estudiantes WHERE cedula = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM administradores WHERE cedula = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM representantes WHERE cedula = ?
      `,
        [cedula, id, cedula, id, cedula, id, cedula],
      );
      if (cedulaExists) throw new Error("CEDULA_DUPLICADA_GLOBAL");
    }

    // 🔥 Validar TELEFONO duplicado (excluye al mismo usuario)
    if (changed.telefono) {
      const telExists = get(
        `
      SELECT 1 FROM profesores WHERE telefono = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM estudiantes WHERE telefono = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM administradores WHERE telefono = ? AND id_usuario != ?
      UNION
      SELECT 1 FROM representantes WHERE telefono = ?
      `,
        [telefono, id, telefono, id, telefono, id, telefono],
      );
      if (telExists) throw new Error("TELEFONO_DUPLICADO_GLOBAL");
    }
    run("BEGIN TRANSACTION");

    try {
      if (changed.correo) {
        run(`UPDATE usuarios SET email = ? WHERE id = ?`, [correo, id]);
      }

      if (user.role === "profesor") {
        run(
          `UPDATE profesores 
         SET nombre = COALESCE(?, nombre),
             apellido = COALESCE(?, apellido),
             cedula = COALESCE(?, cedula),
             correo = COALESCE(?, correo),
             telefono = COALESCE(?, telefono),
             direccion = COALESCE(?, direccion)
         WHERE id_usuario = ?`,
          [nombre, apellido, cedula, correo, telefono, direccion, id],
        );
      }

      if (user.role === "estudiante") {
        run(
          `UPDATE estudiantes 
         SET nombre = COALESCE(?, nombre),
             apellido = COALESCE(?, apellido),
             cedula = COALESCE(?, cedula),
             correo = COALESCE(?, correo),
             telefono = COALESCE(?, telefono),
             lugar_nacimiento = COALESCE(?, lugar_nacimiento),
             entidad_federal = COALESCE(?, entidad_federal)
          WHERE id_usuario = ?`,
          [
            nombre,
            apellido,
            cedula,
            correo,
            telefono,
            // Cambio: conserva datos oficiales del estudiante al editar usuario.
            lugar_nacimiento,
            entidad_federal,
            id,
          ],
        );
      }

      if (user.role === "admin") {
        run(
          `UPDATE administradores 
         SET nombre = COALESCE(?, nombre),
             apellido = COALESCE(?, apellido),
             cedula = COALESCE(?, cedula),
             correo = COALESCE(?, correo),
             telefono = COALESCE(?, telefono),
             direccion = COALESCE(?, direccion)
         WHERE id_usuario = ?`,
          [nombre, apellido, cedula, correo, telefono, direccion, id],
        );
      }

      run("COMMIT");
    } catch (e) {
      run("ROLLBACK");
      throw e;
    }

    return true;
  }
}
