import { run, all, get } from "../src/db.js";

export class AsignaturasModel {
  static async getAllAsignaturas() {
    const sql = "SELECT * FROM asignaturas";
    const result = all(sql);

    if (result.length === 0) {
      return false;
    }
    return result;
  }

  static createAsignatura({ asignatura }) {
    const result = run("INSERT INTO asignaturas (nombre) VALUES (?)", [
      asignatura,
    ]);
    return { id: result.lastInsertRowid, asignatura: asignatura };
  }

  static deleteAsignatura({ id }) {
    const sql = "DELETE FROM asignaturas WHERE id = ?";
    const result = run(sql, [id]);
    if (result.changes > 0) {
      return true;
    }
  }

  static updateAsignatura({ id, asignatura }) {
    console.log(id, asignatura);
    const sql = "UPDATE asignaturas SET nombre = ? WHERE id = ?";
    const result = run(sql, [asignatura, id]);
    if (result.changes > 0) {
      return { id, asignatura };
    }
    return false;
  }
}
