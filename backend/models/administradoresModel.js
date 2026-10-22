import { run, get, all } from "../src/db.js";

export class AdministradoresModel {
  static async getAll({ filtrado, emailExcluir }) {
    const { nombre, apellido } = filtrado;

    let sql = `SELECT a.* FROM administradores a
    INNER JOIN usuarios u ON u.id = a.id_usuario
    WHERE a.deleted_at IS NULL`;
    const params = [];

    if (emailExcluir) {
      sql += ` AND u.email != ?`;
      params.push(emailExcluir);
    }

    if (nombre || apellido) {
      const conditions = [];
      if (nombre) {
        conditions.push("a.nombre LIKE ?");
        params.push(`%${nombre}%`);
      }
      if (apellido) {
        conditions.push("a.apellido LIKE ?");
        params.push(`%${apellido}%`);
      }
      sql += " AND " + conditions.join(" AND ");
    }

    return all(sql, params);
  }

  static async getDeleted() {
    return all("SELECT * FROM administradores WHERE deleted_at IS NOT NULL");
  }

  static async getByCedula({ cedula }) {
    const admin = get("SELECT * FROM administradores WHERE cedula = ?", [
      cedula,
    ]);
    return admin ?? false;
  }

  static async createAdministrador({ input }) {
    const {
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      direccion,
      id_usuario,
    } = input;

    const result = run(
      `INSERT INTO administradores 
      (nombre, apellido, cedula, correo, telefono, direccion, id_usuario)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, apellido, cedula, correo, telefono, direccion, id_usuario],
    );

    if (result && result.error) {
      throw new Error(result.error);
    }

    if (result && result.changes > 0) {
      return { id: result.lastInsertRowid, ...input };
    }

    return null;
  }

  static async deleteAdministrador({ id }) {
    const result = run(
      `UPDATE administradores
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );

    return result.changes > 0;
  }

  static async restoreAdministrador({ id }) {
    const result = run(
      `UPDATE administradores
       SET deleted_at = NULL
       WHERE id = ?`,
      [id],
    );

    return result.changes > 0;
  }

  static async updateAdministrador({ id, input }) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key}=?`);
      values.push(value);
    }

    values.push(id);

    const result = run(
      `UPDATE administradores SET ${fields.join(",")} WHERE id = ?`,
      values,
    );

    if (result && result.error) {
      throw new Error(result.error);
    }
    if (result.changes === 0) {
      throw new Error("NO_CHANGES_APPLIED");
    }

    return { id, ...input };
  }

  static async getById({ id_administrador }) {
    return get(
      `SELECT * FROM administradores 
       WHERE id = ? AND deleted_at IS NULL`,
      [id_administrador],
    );
  }
}
