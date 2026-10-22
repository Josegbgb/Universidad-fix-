import { all, run, get } from "../src/db.js";

export class ProfesorNotaModel {
  static getProfesorByUserId(userId) {
    // Cambio: enlaza el token JWT con el perfil real del profesor.
    return get(
      `SELECT id, correo
       FROM profesores
       WHERE id_usuario = ? AND deleted_at IS NULL`,
      [userId],
    );
  }

  static profesorTieneAsignacion({ userId, id_rel_grado_asignatura }) {
    // Cambio: valida que la asignacion pertenezca al profesor autenticado.
    const row = get(
      `SELECT 1 AS permitido
       FROM profesores p
       INNER JOIN rel_asignatura_profesor rap ON rap.id_profesor = p.id
       WHERE p.id_usuario = ?
         AND rap.id_rel_grado_asignatura = ?
         AND p.deleted_at IS NULL
         AND rap.deleted_at IS NULL
       LIMIT 1`,
      [userId, id_rel_grado_asignatura],
    );

    return Boolean(row);
  }

  static getAsignacionesByProfesor({ correo }) {
    const sql = `
      SELECT 
        rga.id as id_rel_grado_asignatura,
        a.nombre as asignatura,
        g.anio,
        g.seccion
      FROM profesores p
      INNER JOIN rel_asignatura_profesor rap 
        ON rap.id_profesor = p.id
      INNER JOIN rel_grado_asignatura rga 
        ON rga.id = rap.id_rel_grado_asignatura
      INNER JOIN grados g 
        ON g.id = rga.id_grado
      INNER JOIN asignaturas a 
        ON a.id = rga.id_asignatura
      WHERE p.correo = ?
        AND rap.deleted_at IS NULL
    `;
    return all(sql, [correo]);
  }

  static getAsignaciones(id_profesor) {
    const sql = `
      SELECT 
        rga.id as id_rel_grado_asignatura,
        a.nombre as asignatura,
        g.anio,
        g.seccion
      FROM rel_asignatura_profesor rap
      INNER JOIN rel_grado_asignatura rga 
        ON rga.id = rap.id_rel_grado_asignatura
      INNER JOIN asignaturas a 
        ON a.id = rga.id_asignatura
      INNER JOIN grados g 
        ON g.id = rga.id_grado
      WHERE rap.id_profesor = ?
        AND rap.deleted_at IS NULL
    `;
    return all(sql, [id_profesor]);
  }

  static getNotasByRelacion(id_rel_grado_asignatura, id_periodo) {
    // id_periodo es requerido para no mezclar notas de distintos años
    if (!id_periodo) throw new Error("ID_PERIODO_REQUERIDO");

    const sql = `
      SELECT 
        e.id as id_estudiante,
        e.nombre,
        e.apellido,
        e.cedula,
        e.telefono,
        l.numero as lapso,
        CASE WHEN n.inasistente = 1 THEN 'IN' ELSE n.nota END AS nota,
        reg.id as id_rel_estudiante_grado
      FROM rel_estudiante_grado reg
      INNER JOIN estudiantes e 
        ON e.id = reg.id_estudiante
      INNER JOIN rel_grado_asignatura rga
        ON rga.id = ?
      INNER JOIN lapsos l
      LEFT JOIN notas n 
        ON n.id_rel_estudiante_grado = reg.id
        AND n.id_rel_grado_asignatura = rga.id
        AND n.id_lapso = l.id
        AND n.id_periodo = ?
      WHERE reg.id_grado = rga.id_grado
        AND reg.id_periodo = ?
    `;
    // Cambio: notas y relacion deben pertenecer al mismo periodo.
    return all(sql, [id_rel_grado_asignatura, id_periodo, id_periodo]);
  }

  // ✅ ACTUALIZADO: ahora requiere id_periodo
  static saveNota({
    id_rel_estudiante_grado,
    id_rel_grado_asignatura,
    id_lapso,
    nota,
  }) {
    // Cambio: la nota hereda el periodo desde la relacion estudiante-grado.
    const rel = get(
      `SELECT reg.id_periodo, reg.id_grado, rga.id_grado AS id_grado_asignatura
       FROM rel_estudiante_grado reg
       INNER JOIN rel_grado_asignatura rga ON rga.id = ?
       WHERE reg.id = ?`,
      [id_rel_grado_asignatura, id_rel_estudiante_grado],
    );
    if (!rel) throw new Error("REL_ESTUDIANTE_GRADO_NO_ENCONTRADA");
    if (rel.id_grado !== rel.id_grado_asignatura) {
      throw new Error("ASIGNACION_NO_CORRESPONDE_AL_GRADO");
    }

    // Cambio: "IN" (inasistente) se guarda como nota 0 con inasistente = 1.
    const esIN = typeof nota === "string" && nota.trim().toUpperCase() === "IN";

    return run(
      `INSERT INTO notas (id_rel_estudiante_grado, id_rel_grado_asignatura, id_lapso, nota, inasistente, id_periodo)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id_rel_estudiante_grado, id_rel_grado_asignatura, id_lapso)
       DO UPDATE SET nota = excluded.nota,
                     inasistente = excluded.inasistente,
                     id_periodo = excluded.id_periodo`,
      [
        id_rel_estudiante_grado,
        id_rel_grado_asignatura,
        id_lapso,
        esIN ? null : nota,
        esIN ? 1 : 0,
        rel.id_periodo,
      ],
    );
  }

  // ✅ ACTUALIZADO: filtra por id_periodo para no mezclar años
  static getNotasByGrado(id_grado, id_periodo) {
    if (!id_periodo) throw new Error("ID_PERIODO_REQUERIDO");

    const sql = `
      SELECT 
        e.id as id_estudiante,
        e.nombre,
        e.apellido,
        reg.id as id_rel_estudiante_grado,
        rga.id as id_rel_grado_asignatura,
        a.nombre as asignatura,
        l.numero as lapso,
        CASE WHEN n.inasistente = 1 THEN 'IN' ELSE n.nota END AS nota
      FROM rel_estudiante_grado reg
      INNER JOIN estudiantes e 
        ON e.id = reg.id_estudiante
      INNER JOIN grados g
        ON g.id = reg.id_grado
      INNER JOIN rel_grado_asignatura rga
        ON rga.id_grado = g.id
        AND rga.deleted_at IS NULL
      INNER JOIN asignaturas a
        ON a.id = rga.id_asignatura
      INNER JOIN lapsos l
      LEFT JOIN notas n
        ON n.id_rel_estudiante_grado = reg.id
        AND n.id_rel_grado_asignatura = rga.id
        AND n.id_lapso = l.id
        AND n.id_periodo = ?
      WHERE g.id = ?
        AND reg.id_periodo = ?
      ORDER BY e.id, rga.id, l.numero
    `;
    // Cambio: permite revisar notas historicas de relaciones ya cerradas.
    return all(sql, [id_periodo, id_grado, id_periodo]);
  }
}
