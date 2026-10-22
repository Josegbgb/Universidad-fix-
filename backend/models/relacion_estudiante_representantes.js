import { all, get, run } from "../src/db.js";

export class RelacionEstudianteRepresentanteModel {
  static getByEstudiante({ id_estudiante }) {
    let sql = `
      SELECT
        rel.id AS id,
        representantes.id AS id_representante,
        representantes.nombre,
        representantes.apellido,
        representantes.cedula,
        representantes.correo,
        representantes.telefono,
        representantes.direccion,
        rel.parentesco
      FROM rel_estudiante_representante rel
      INNER JOIN representantes 
        ON rel.id_representante = representantes.id
    `;

    const params = [];

    if (id_estudiante) {
      sql += ` WHERE rel.id_estudiante = ?`;
      params.push(id_estudiante);
    }

    sql += ` ORDER BY representantes.apellido, representantes.nombre`;

    return all(sql, params);
  }

  // =========================
  // CREAR RELACIÓN
  // =========================
  static createRelacion({ id_estudiante, id_representante, parentesco }) {
    // evitar duplicados
    const checkSql = `
      SELECT * FROM rel_estudiante_representante
      WHERE id_estudiante = ? AND id_representante = ?
    `;
    const exists = get(checkSql, [id_estudiante, id_representante]);

    if (exists) {
      throw new Error("Este representante ya está asignado al estudiante");
    }

    const sql = `
      INSERT INTO rel_estudiante_representante 
      (id_estudiante, id_representante, parentesco)
      VALUES (?, ?, ?)
    `;

    const result = run(sql, [id_estudiante, id_representante, parentesco]);

    return {
      id: result.lastInsertRowid,
      id_estudiante,
      id_representante,
      parentesco,
    };
  }

  // =========================
  // ELIMINAR RELACIÓN
  // =========================
  static deleteRelacion({ id }) {
    const sql = `
      DELETE FROM rel_estudiante_representante
      WHERE id = ?
    `;

    const result = run(sql, [id]);
    return result.changes > 0;
  }

  // =========================
  // ACTUALIZAR RELACIÓN
  // =========================
  static updateRelacion({ id, input }) {
    const { id_representante, parentesco } = input;

    const sql = `
      UPDATE rel_estudiante_representante
      SET id_representante = ?, parentesco = ?
      WHERE id = ?
    `;

    const result = run(sql, [id_representante, parentesco, id]);

    if (result.changes === 0) {
      return false;
    }

    return { id, ...input };
  }
}
