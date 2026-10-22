import { all, get } from "../src/db.js";

export class EstudianteNotasModel {
  static getNotasByUserId({ userId }) {
    const estudiante = get("SELECT id FROM estudiantes WHERE id_usuario = ?", [
      userId,
    ]);
    if (!estudiante) return [];

    const rel = get(
      `SELECT reg.id, reg.id_grado, reg.id_periodo
       FROM rel_estudiante_grado reg
       WHERE reg.id_estudiante = ?
         AND reg.activo = 1
         AND reg.deleted_at IS NULL
         AND reg.id_periodo = (
           SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1
         )`,
      [estudiante.id],
    );
    if (!rel) return [];

    const sql = `
      SELECT 
        a.nombre AS asignatura,
        l.numero AS lapso,
        CASE WHEN n.inasistente = 1 THEN 'IN' ELSE COALESCE(n.nota, 0) END AS nota,
        g.anio,
        g.seccion
      FROM rel_grado_asignatura rga
      INNER JOIN asignaturas a ON a.id = rga.id_asignatura
      INNER JOIN grados g ON g.id = rga.id_grado
      CROSS JOIN lapsos l
      LEFT JOIN notas n 
        ON n.id_rel_grado_asignatura = rga.id
        AND n.id_rel_estudiante_grado = ?
        AND n.id_lapso = l.id
        AND n.id_periodo = ?
      WHERE rga.id_grado = ?
        AND rga.deleted_at IS NULL
      ORDER BY a.nombre, l.numero
    `;
    // Cambio: las notas del estudiante se leen solo del periodo activo.
    return all(sql, [rel.id, rel.id_periodo, rel.id_grado]);
  }

  // ✅ ACTUALIZADO: historial incluye nombre del periodo escolar
  static getHistorialByStudentId({ id_estudiante }) {
    const estudiante = get(
      "SELECT id, nombre, apellido FROM estudiantes WHERE id = ?",
      [id_estudiante],
    );
    if (!estudiante) return null;

    const relaciones = all(
      `SELECT
         reg.id,
         reg.id_grado,
         reg.id_periodo,
         g.anio,
         g.seccion,
         pe.nombre AS periodo
       FROM rel_estudiante_grado reg
       INNER JOIN grados g ON g.id = reg.id_grado
       LEFT JOIN periodos_escolares pe ON pe.id = reg.id_periodo
       WHERE reg.id_estudiante = ?
       ORDER BY pe.nombre ASC, g.anio ASC`,
      [id_estudiante],
    );

    const historial = relaciones.map((rel) => {
      // Cambio: cada historial consulta notas del periodo de su relacion.
      const notas = all(
        `SELECT 
           a.nombre AS asignatura,
           l.numero AS lapso,
           CASE WHEN n.inasistente = 1 THEN 'IN' ELSE COALESCE(n.nota, 0) END AS nota
         FROM rel_grado_asignatura rga
         INNER JOIN asignaturas a ON a.id = rga.id_asignatura
         CROSS JOIN lapsos l
         LEFT JOIN notas n 
           ON n.id_rel_grado_asignatura = rga.id
           AND n.id_rel_estudiante_grado = ?
           AND n.id_lapso = l.id
           AND n.id_periodo = ?
         WHERE rga.id_grado = ?
         ORDER BY a.nombre, l.numero`,
        [rel.id, rel.id_periodo, rel.id_grado],
      );

      return {
        periodo: rel.periodo ?? "Sin periodo", // ← nuevo
        anio: rel.anio,
        seccion: rel.seccion,
        notas,
      };
    });

    return {
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      historial,
    };
  }

  static getHistorialByUserId({ userId }) {
    const estudiante = get(
      "SELECT id, nombre, apellido FROM estudiantes WHERE id_usuario = ?",
      [userId],
    );
    if (!estudiante) return [];

    const relaciones = all(
      `SELECT
         reg.id,
         reg.id_grado,
         reg.id_periodo,
         g.anio,
         g.seccion,
         pe.nombre AS periodo
       FROM rel_estudiante_grado reg
       INNER JOIN grados g ON g.id = reg.id_grado
       LEFT JOIN periodos_escolares pe ON pe.id = reg.id_periodo
       WHERE reg.id_estudiante = ?
       ORDER BY pe.nombre ASC, g.anio ASC`,
      [estudiante.id],
    );

    if (relaciones.length === 0) return [];

    const historial = relaciones.map((rel) => {
      // Cambio: cada historial consulta notas del periodo de su relacion.
      const notas = all(
        `SELECT 
           a.nombre AS asignatura,
           l.numero AS lapso,
           CASE WHEN n.inasistente = 1 THEN 'IN' ELSE COALESCE(n.nota, 0) END AS nota
         FROM rel_grado_asignatura rga
         INNER JOIN asignaturas a ON a.id = rga.id_asignatura
         CROSS JOIN lapsos l
         LEFT JOIN notas n ON n.id_rel_grado_asignatura = rga.id
           AND n.id_rel_estudiante_grado = ?
           AND n.id_lapso = l.id
           AND n.id_periodo = ?
         WHERE rga.id_grado = ?
         ORDER BY a.nombre, l.numero`,
        [rel.id, rel.id_periodo, rel.id_grado],
      );

      return {
        periodo: rel.periodo ?? "Sin periodo", // ← nuevo
        anio: rel.anio,
        seccion: rel.seccion,
        notas,
      };
    });

    return {
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      historial,
    };
  }
}
