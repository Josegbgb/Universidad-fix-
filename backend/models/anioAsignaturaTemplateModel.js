import { all, get, run } from "../src/db.js";

export class AnioAsignaturaTemplateModel {
  static async getByAnio(anio) {
    return all(
      `
      SELECT t.id, a.id AS id_asignatura, a.nombre
      FROM anio_asignatura_template t
      JOIN asignaturas a ON t.id_asignatura = a.id
      WHERE t.anio = ?
      ORDER BY a.nombre
      `,
      [anio],
    );
  }

  static async add({ anio, id_asignatura }) {
    return run(
      `
      INSERT INTO anio_asignatura_template (anio, id_asignatura)
      VALUES (?, ?)
      `,
      [anio, id_asignatura],
    );
  }

  static async remove({ anio, id_asignatura }) {
    return run(
      `
      DELETE FROM anio_asignatura_template
      WHERE anio = ? AND id_asignatura = ?
      `,
      [anio, id_asignatura],
    );
  }
}
