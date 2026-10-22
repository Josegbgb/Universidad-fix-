import { run, get, all } from "../src/db.js";

export class relacion_asignatura_profesorModel {
  static async getAll() {
    const sql = `
    SELECT 
    rap.id AS relacion_asignatura_profesor_id,
      p.id AS id_profesor,
      p.nombre,
      p.apellido,
      p.cedula,
      COALESCE(a.nombre, 'Sin asignar') AS asignatura,
      COALESCE(rga.id, 'Sin Asignar') AS id_relacion_grado_asignatura
    FROM 
      profesores p
    LEFT JOIN 
      rel_asignatura_profesor rap ON p.id = rap.id_profesor
    LEFT JOIN 
      rel_grado_asignatura rga ON rap.id_rel_grado_asignatura = rga.id
    LEFT JOIN 
      asignaturas a ON rga.id_asignatura = a.id
    ORDER BY 
      p.apellido, p.nombre, a.nombre
  `;
    return all(sql);
  }

  static getByid({ id_profesor }) {
    if (!id_profesor) return false;

    const sql = `
    SELECT 
      rap.id,
      p.id AS id_profesor,
      p.nombre,
      p.apellido,
      p.cedula,
      g.anio,
      g.seccion,
      COALESCE(a.nombre, 'Sin asignar') AS asignatura,
      COALESCE(rga.id, NULL) AS id_relacion_grado_asignatura
    FROM profesores p
    LEFT JOIN rel_asignatura_profesor rap 
      ON p.id = rap.id_profesor 
      AND p.id = ?
      AND rap.deleted_at IS NULL              -- ✅ solo asignaciones activas
    LEFT JOIN rel_grado_asignatura rga 
      ON rap.id_rel_grado_asignatura = rga.id
      AND rga.deleted_at IS NULL              -- ✅ solo pensum activo
    LEFT JOIN asignaturas a ON rga.id_asignatura = a.id
    LEFT JOIN grados g ON rga.id_grado = g.id
    WHERE p.id = ?
    ORDER BY a.nombre
  `;
    return all(sql, [id_profesor, id_profesor]);
  }

  static async create({ id_rel_grado_asignatura, id_profesor }) {
    const insertSql = `
    INSERT INTO rel_asignatura_profesor 
    (id_rel_grado_asignatura, id_profesor) 
    VALUES (?,?)
  `;

    const result = await run(insertSql, [id_rel_grado_asignatura, id_profesor]);

    if (result.changes === 0) {
      return false;
    }

    const idInsertado = result.lastInsertRowid;
    console.log("ID INSERTADO:", idInsertado);
    const sql = `
    SELECT 
      rap.id AS relacion_asignatura_profesor_id,
      p.id AS id_profesor,
      p.nombre,
      p.apellido,
      g.anio,
      g.seccion,
      a.nombre AS asignatura,
      rga.id AS id_relacion_grado_asignatura
    FROM rel_asignatura_profesor rap
    JOIN profesores p ON rap.id_profesor = p.id
    JOIN rel_grado_asignatura rga ON rap.id_rel_grado_asignatura = rga.id
    JOIN asignaturas a ON rga.id_asignatura = a.id
    JOIN grados g ON rga.id_grado = g.id
    WHERE rap.id = ?
  `;

    return await get(sql, [idInsertado]);
  }

  static deleteByProfesor({ id_profesor }) {
    const sql = `
    DELETE FROM rel_asignatura_profesor
    WHERE id_profesor = ?
  `;
    const result = run(sql, [id_profesor]);
    return result.changes;
  }

  static delete({ id }) {
    const sql = "DELETE FROM rel_asignatura_profesor WHERE id = ?";
    const result = run(sql, [id]);
    return result.changes > 0;
  }
}
