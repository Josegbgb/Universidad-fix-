import { run, get, all } from "../src/db.js";

export class ProfesoresModel {
  static async getAll({ filtrado }) {
    const { nombre, apellido } = filtrado;
    let sql = "SELECT * FROM profesores WHERE deleted_at IS NULL"; // Cambiado a IS NULL
    const params = [];

    if (nombre || apellido) {
      const conditions = [];

      if (nombre) {
        conditions.push("nombre LIKE ?");
        params.push(`%${nombre}%`);
      }
      if (apellido) {
        conditions.push("apellido LIKE ?");
        params.push(`%${apellido}%`);
      }

      // Agregar las condiciones con AND (no WHERE adicional)
      sql += " AND " + conditions.join(" AND ");
    }
    return all(sql, params);
  }
  static getPendientesByProfesor(id_profesor) {
    const sql = `
  SELECT 
    e.id as id_estudiante,
    e.nombre,
    e.apellido,
    g.anio as anio_origen,
    g.seccion,
    a.nombre as asignatura,
    eap.id as id_pendiente

  FROM estudiante_asignatura_pendiente eap

  INNER JOIN estudiantes e 
    ON e.id = eap.id_estudiante

  INNER JOIN asignaturas a 
    ON a.id = eap.id_asignatura

  INNER JOIN grados g 
    ON g.id = eap.id_grado_origen

  INNER JOIN rel_grado_asignatura rga
    ON rga.id_asignatura = a.id

  INNER JOIN rel_asignatura_profesor rap
    ON rap.id_rel_grado_asignatura = rga.id

  WHERE rap.id_profesor = ?
    AND eap.aprobada = 0
    AND rap.deleted_at IS NULL
  `;

    return all(sql, [id_profesor]);
  }
  static async getDeleted() {
    const sql = "SELECT * FROM profesores WHERE deleted_at IS NOT NULL";
    return all(sql);
  }

  static async getByCedula({ cedula }) {
    const sql = "SELECT * FROM profesores WHERE cedula = ?";
    const profesor = get(sql, [cedula]);
    if (profesor !== undefined) {
      return profesor;
    }
    return false;
  }

  static async createProfesor({ input }) {
    const {
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      direccion,
      id_usuario,
    } = input;
    const sql =
      "INSERT INTO profesores (nombre, apellido, cedula, correo, telefono, direccion, id_usuario) VALUES (?, ?, ?,?,?,?,?)";
    const result = run(sql, [
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      direccion,
      id_usuario,
    ]);

    if (result && result.error) {
      throw new Error(result.error);
    }

    if (result && result.changes > 0) {
      return { id: result.lastInsertRowid, ...input };
    }

    return null;
  }
  ///
  static async getAllWithCapacidades() {
    const sql = `
    SELECT 
      p.id,
      p.nombre,
      p.apellido,
      p.cedula,
      p.correo,
      p.telefono,
      p.direccion,
      (
        SELECT json_group_array(
          json_object('id', a.id, 'nombre', a.nombre)
        )
        FROM rel_profesor_asignatura rpa
        JOIN asignaturas a ON a.id = rpa.id_asignatura
        WHERE rpa.id_profesor = p.id AND rpa.deleted_at IS NULL
      ) AS asignaturas_capaces
    FROM profesores p
    WHERE p.deleted_at IS NULL
  `;
    const results = all(sql);

    // Parsear el JSON string a array
    return results.map((prof) => ({
      ...prof,
      asignaturas_capaces: JSON.parse(prof.asignaturas_capaces || "[]"),
    }));
  }
  static async deleteProfesor({ id }) {
    const sql = `
    UPDATE profesores
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = ? AND deleted_at IS NULL
  `;
    const result = run(sql, [id]);
    return result.changes > 0;
  }

  //
  static async getById({ id_profesor }) {
    const profesor = await get(
      `
    SELECT *
    FROM profesores
    WHERE id = ? AND deleted_at IS NULL
  `,
      [id_profesor],
    );

    if (!profesor) return null;

    const asignaturas = await all(
      `
    SELECT 
      a.id,
      a.nombre
    FROM rel_profesor_asignatura rpa
    JOIN asignaturas a ON a.id = rpa.id_asignatura
    WHERE rpa.id_profesor = ?
  `,
      [id_profesor],
    );

    return {
      ...profesor,
      asignaturas_capaces: asignaturas,
    };
  }

  static async restoreProfesor({ id }) {
    const result = run(
      `UPDATE profesores
    SET deleted_at = NULL
    WHERE id = ?`,
      [id],
    );
    return result.changes > 0;
  }

  ///
  static async updateProfesor({ id, input }) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key}=?`);
      values.push(value);
    }
    values.push(id);
    const sql = `UPDATE profesores SET ${fields.join(",")} WHERE id = ?`;
    const result = run(sql, values);
    if (result && result.error) {
      throw new Error(result.error);
    }
    if (result.changes === 0) {
      throw new Error("NO_CHANGES_APPLIED");
    }

    return { id, ...input };
  }
}
