import { all, get, run } from "../src/db.js";

export class EstudiantesModel {
  //Obtener todos y por año

  static async getAll() {
    // Cambio: el listado muestra la relacion del periodo activo.
    const sql = `
      SELECT 
        e.id,
        e.nombre,
        e.apellido,
        e.cedula,
        e.correo,
        e.telefono,
        e.lugar_nacimiento,
        e.entidad_federal,
        COALESCE(g.anio, 'Sin Asignar') AS año,
        COALESCE(g.seccion, 'Sin Asignar') AS seccion
      FROM estudiantes e
      LEFT JOIN rel_estudiante_grado reg 
        ON e.id = reg.id_estudiante
        AND reg.activo = 1
        AND reg.deleted_at IS NULL
        AND reg.id_periodo = (
          SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1
        )
      LEFT JOIN grados g 
        ON reg.id_grado = g.id
      WHERE e.deleted_at IS NULL AND e.egresado = 0
    `;
    return all(sql);
  }

  //obtener eliminados

  static async getDeleted() {
    const sql = `
    SELECT 
      e.*,
      json_group_array(
        json_object(
          'id_representante', r.id,
          'nombre', r.nombre,
          'apellido', r.apellido,
          'cedula', r.cedula,
          'telefono', r.telefono,
          'correo', r.correo,
          'parentesco', rer.parentesco
        )
      ) AS representantes
    FROM estudiantes e
    LEFT JOIN rel_estudiante_representante rer ON rer.id_estudiante = e.id
    LEFT JOIN representantes r ON r.id = rer.id_representante
    WHERE e.deleted_at IS NOT NULL
    GROUP BY e.id
  `;
    const rows = all(sql);
    return rows.map((row) => ({
      ...row,
      representantes: JSON.parse(row.representantes).filter(
        (r) => r.id_representante !== null,
      ),
    }));
  }

  static async getEgresados() {
    return all(`
    SELECT 
      e.id,
      e.nombre,
      e.apellido,
      e.cedula,
      e.correo,
      e.telefono,
      e.lugar_nacimiento,
      e.entidad_federal,

      g.anio,
      g.seccion,

      r.id AS id_representante,
      r.nombre AS nombre_representante,
      r.apellido AS apellido_representante,
      r.cedula AS cedula_representante,
      r.telefono AS telefono_representante,
      r.correo AS correo_representante,
      rer.parentesco

    FROM estudiantes e

    LEFT JOIN rel_estudiante_grado reg 
      ON reg.id_estudiante = e.id 
      AND reg.deleted_at IS NULL

    LEFT JOIN grados g 
      ON g.id = reg.id_grado

    LEFT JOIN rel_estudiante_representante rer 
      ON rer.id_estudiante = e.id 
      AND rer.deleted_at IS NULL

    LEFT JOIN representantes r 
      ON r.id = rer.id_representante

    WHERE e.egresado = 1 
    AND e.deleted_at IS NULL

    ORDER BY e.apellido, e.nombre
  `);
  }

  //Obtener por cedula

  static async GetByCedula({ cedula }) {
    return get("select * FROM estudiantes WHERE cedula= ?", [cedula]);
  }

  static async getById({ id_estudiante }) {
    const estudiante = await get(
      `
    SELECT *
    FROM estudiantes
    WHERE id = ? AND deleted_at IS NULL
  `,
      [id_estudiante],
    );

    if (!estudiante) return null;

    return {
      ...estudiante,
    };
  }

  //crear estudiante

  static async CreateStudent({ input }) {
    const {
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      lugar_nacimiento,
      entidad_federal,
      id_usuario,
    } = input;
    // Cambio: registra lugar de nacimiento y entidad federal del estudiante.
    const result = run(
      `INSERT INTO estudiantes
       (nombre, apellido, cedula, correo, telefono, lugar_nacimiento, entidad_federal, id_usuario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre,
        apellido,
        cedula,
        correo,
        telefono,
        lugar_nacimiento,
        entidad_federal,
        id_usuario,
      ],
    );

    if (result && result.error) {
      throw new Error(result.error);
    }

    if (result && result.changes > 0) {
      return { id: result.lastInsertRowid, ...input };
    }

    return null;
  }

  //Eliminar estudiante

  static async DeleteStudent({ id }) {
    const result = run(
      `UPDATE estudiantes 
      SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return result.changes > 0;
  }

  //restore estudiante
  static async RestoreStudent({ id }) {
    const result = run(
      `UPDATE estudiantes 
      SET deleted_at = NULL 
      WHERE id = ?`,
      [id],
    );
    return result.changes > 0;
  }

  //Actualizar estudiante

  static async UpdateStudent({ id, input }) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(input)) {
      fields.push(`${key}=?`);
      values.push(value);
    }

    values.push(id);

    const sql = `UPDATE estudiantes SET ${fields.join(", ")} WHERE id =?`;
    const result = run(sql, values);
    if (result && result.error) {
      throw new Error(result.error);
    }
    if (result.changes === 0) {
      throw new Error("NO_CHANGES_APPLIED");
    }

    return get("SELECT * FROM estudiantes WHERE id = ?", [id]);
  }

  static async hardDeleteStudent({ id }) {
    // 🔹 Obtener representantes del estudiante
    const representantes = all(
      `SELECT id_representante FROM rel_estudiante_representante WHERE id_estudiante = ?`,
      [id],
    );

    // 🔹 Eliminar relaciones
    run(`DELETE FROM rel_estudiante_grado WHERE id_estudiante = ?`, [id]);
    run(`DELETE FROM rel_estudiante_representante WHERE id_estudiante = ?`, [
      id,
    ]);

    // 🔹 Eliminar representantes que no tengan otros estudiantes
    for (const rep of representantes) {
      const otros = get(
        `SELECT 1 FROM rel_estudiante_representante WHERE id_representante = ?`,
        [rep.id_representante],
      );
      if (!otros) {
        run(`DELETE FROM representantes WHERE id = ?`, [rep.id_representante]);
      }
    }

    // 🔹 Eliminar estudiante
    const result = run(`DELETE FROM estudiantes WHERE id = ?`, [id]);
    return result.changes > 0;
  }

  // Obtener ID de usuario antes de hard delete
  static async getUserIdByStudentId({ id }) {
    const result = get("SELECT id_usuario FROM estudiantes WHERE id = ?", [id]);
    return result?.id_usuario;
  }
}
