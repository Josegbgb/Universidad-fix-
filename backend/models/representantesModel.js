import { all, get, run } from "../src/db.js";

export class RepresentantesModel {
  //Obtener todos y por año

  static async getAll() {
    // Cambio: representantes se listan con la relacion escolar del periodo activo.
    const sql = `
    SELECT 
      r.*, 
      e.nombre AS nombre_estudiante, 
      e.apellido AS apellido_estudiante,
      rer.parentesco,
      g.anio AS grado_anio,
      g.seccion AS grado_seccion
    FROM representantes r
    JOIN rel_estudiante_representante rer 
      ON r.id = rer.id_representante 
      AND rer.deleted_at IS NULL
    JOIN estudiantes e 
      ON rer.id_estudiante = e.id 
      AND e.deleted_at IS NULL
    JOIN rel_estudiante_grado reg
      ON reg.id_estudiante = e.id
      AND reg.activo = 1
      AND reg.id_periodo = (
        SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1
      )
      AND reg.deleted_at IS NULL
    JOIN grados g
      ON reg.id_grado = g.id
    WHERE r.deleted_at IS NULL
  `;

    return all(sql);
  }

  //Obtener por cedula

  static async GetByCedula({ cedula }) {
    return get("select * FROM representantes WHERE cedula= ?", [cedula]);
  }

  static async getDeleted() {
    const sql = `
    SELECT 
      r.*, 
      e.nombre AS nombre_estudiante, 
      e.apellido AS apellido_estudiante,
      rer.parentesco,
      g.anio AS grado_anio,
      g.seccion AS grado_seccion

    FROM representantes r

    LEFT JOIN rel_estudiante_representante rer 
      ON r.id = rer.id_representante

    LEFT JOIN estudiantes e 
      ON rer.id_estudiante = e.id

    LEFT JOIN rel_estudiante_grado reg
      ON reg.id_estudiante = e.id

    LEFT JOIN grados g
      ON reg.id_grado = g.id

    WHERE r.deleted_at IS NOT NULL
  `;

    return all(sql);
  }

  //crear representante

  static async CreateRepresentante({ input }) {
    const { nombre, apellido, cedula, correo, telefono, direccion } = input;

    const result = run(
      "INSERT INTO representantes (nombre, apellido, cedula, correo, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, apellido, cedula, correo, telefono, direccion],
    );

    // 🔥 VERIFICAR ERRORES DE UNIQUE
    if (result && result.error) {
      throw new Error(result.error);
    }

    if (result && result.changes > 0) {
      return { id: result.lastInsertRowid, ...input };
    }

    return null;
  }
  //Eliminar representante

  static async DeleteRepresentante({ id }) {
    const result = run(
      `UPDATE representantes 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return result.changes > 0;
  }

  static async RestoreRepresentante({ id }) {
    const result = run(
      `UPDATE representantes 
     SET deleted_at = NULL 
     WHERE id = ?`,
      [id],
    );
    return result.changes > 0;
  }

  // ELIMINACIÓN DEFINITIVA (HARD DELETE)
  static async hardDeleteRepresentante({ id }) {
    // Primero eliminar relaciones
    run(`DELETE FROM rel_estudiante_representante WHERE id_representante = ?`, [
      id,
    ]);

    // Luego eliminar el representante
    const result = run(`DELETE FROM representantes WHERE id = ?`, [id]);

    return result.changes > 0;
  }

  //Actualizar representante

  static async UpdateRepresentante({ id, input }) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key}=?`);
      values.push(value);
    }

    values.push(id);

    const sql = `UPDATE representantes SET ${fields.join(", ")} WHERE id =?`;
    const result = run(sql, values);
    // 🔥 VERIFICAR ERRORES DE UNIQUE
    if (result && result.error) {
      throw new Error(result.error);
    }

    if (result.changes === 0) {
      return false;
    }

    return get("SELECT * FROM representantes WHERE id = ?", [id]);
  }
}
