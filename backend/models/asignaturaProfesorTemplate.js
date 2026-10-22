import { run, all } from "../src/db.js";

export class RelProfesorAsignaturaModel {
  // ✅ obtener asignaturas de un profesor
  static async getByProfesor({ id_profesor }) {
    const sql = `
      SELECT rpa.id, a.id AS id_asignatura, a.nombre
      FROM rel_profesor_asignatura rpa
      JOIN asignaturas a ON a.id = rpa.id_asignatura
      WHERE rpa.id_profesor = ?
        AND rpa.deleted_at IS NULL
    `;
    return all(sql, [id_profesor]);
  }

  // ✅ insertar múltiples (multiselect)
  static async bulkInsert({ id_profesor, asignaturas }) {
    for (const id_asignatura of asignaturas) {
      // 🔹 intentar revivir si existe soft deleted
      const revive = run(
        `
      UPDATE rel_profesor_asignatura
      SET deleted_at = NULL
      WHERE id_profesor = ?
        AND id_asignatura = ?
        AND deleted_at IS NOT NULL
    `,
        [id_profesor, id_asignatura],
      );

      // 🔹 si no existía, insertar
      if (revive.changes === 0) {
        run(
          `
        INSERT INTO rel_profesor_asignatura
        (id_profesor, id_asignatura)
        VALUES (?, ?)
      `,
          [id_profesor, id_asignatura],
        );
      }
    }

    return true;
  }

  // ✅ soft delete por profesor (útil en update sync)
  static async deleteByProfesor({ id_profesor }) {
    const sql = `
      UPDATE rel_profesor_asignatura
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id_profesor = ?
        AND deleted_at IS NULL
    `;
    run(sql, [id_profesor]);
    return true;
  }

  // 🔥 sync PRO (recomendado)
  static async syncAsignaturas({ id_profesor, asignaturas }) {
    // 1️⃣ ELIMINAR TODAS LAS ASIGNATURAS ACTUALES (HARD DELETE)
    const sqlDelete = `DELETE FROM rel_profesor_asignatura WHERE id_profesor = ?`;
    run(sqlDelete, [id_profesor]);

    // 2️⃣ INSERTAR LAS NUEVAS
    for (const id_asignatura of asignaturas) {
      run(
        `INSERT INTO rel_profesor_asignatura (id_profesor, id_asignatura) VALUES (?, ?)`,
        [id_profesor, id_asignatura],
      );
    }

    return true;
  }
}
