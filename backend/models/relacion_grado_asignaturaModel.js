import { run, get, all } from "../src/db.js";

export class RelacionGradoAsignaturaModel {
  static async getAll({ anio }) {
    if (anio) {
      const sql = `
      SELECT DISTINCT
        rga.id AS relacion_id,
        a.id AS asignatura_id,
        a.nombre AS asignatura,
        g.anio,
        g.seccion,
        rap.id AS relacion_asignatura_profesor_id,
        CASE 
          WHEN rga.id IS NULL THEN NULL
          WHEN p.id IS NULL THEN 'Sin Asignar'
          ELSE p.nombre || ' ' || p.apellido
        END AS profesor_asignado
      FROM grados g
      LEFT JOIN rel_grado_asignatura rga 
        ON rga.id_grado = g.id 
        AND rga.deleted_at IS NULL          -- condición en el JOIN, no en WHERE
      LEFT JOIN asignaturas a ON rga.id_asignatura = a.id
      LEFT JOIN rel_asignatura_profesor rap 
        ON rga.id = rap.id_rel_grado_asignatura 
        AND rap.deleted_at IS NULL
      LEFT JOIN profesores p ON rap.id_profesor = p.id
      WHERE g.anio = ? AND g.activo = 1     -- Cambio: oculta grados deshabilitados
      ORDER BY a.nombre;
    `;
      return all(sql, [anio]);
    }

    const sql = `
    SELECT DISTINCT
      rga.id AS relacion_id,
      g.anio,
      g.seccion,
      a.id AS asignatura_id,
      a.nombre AS asignatura,
      rap.id AS relacion_asignatura_profesor_id,
      CASE 
        WHEN rga.id IS NULL THEN NULL
        WHEN p.id IS NULL THEN 'Sin Asignar'
        ELSE p.nombre || ' ' || p.apellido
      END AS profesor_asignado 
    FROM grados g                           -- grados es ahora la tabla base
    LEFT JOIN rel_grado_asignatura rga 
      ON rga.id_grado = g.id 
      AND rga.deleted_at IS NULL            -- condición en el JOIN, no en WHERE
    LEFT JOIN asignaturas a ON rga.id_asignatura = a.id
    LEFT JOIN rel_asignatura_profesor rap 
      ON rga.id = rap.id_rel_grado_asignatura 
      AND rap.deleted_at IS NULL
    LEFT JOIN profesores p ON rap.id_profesor = p.id
    WHERE g.activo = 1                      -- Cambio: oculta grados deshabilitados
    ORDER BY g.anio, g.seccion;
  `;
    return all(sql);
  }

  static async createRelacion({ id_asignatura, anio }) {
    // 1. Verificar si YA EXISTE ACTIVA en TODAS las secciones del año
    const existsActive = await get(
      `
    SELECT 1 FROM rel_grado_asignatura rga
    JOIN grados g ON rga.id_grado = g.id
    WHERE rga.id_asignatura = ? AND g.anio = ?
    AND rga.deleted_at IS NULL
    LIMIT 1
  `,
      [id_asignatura, anio],
    );

    if (existsActive) {
      throw new Error("Esta asignatura ya está asignada a este año");
    }

    // 2. Reactivar todas las que estén soft-deleted en ese año
    //    (puede haber una por cada sección)
    await run(
      `
    UPDATE rel_grado_asignatura
    SET deleted_at = NULL
    WHERE id_asignatura = ?
    AND id_grado IN (
      SELECT id FROM grados WHERE anio = ?
    )
    AND deleted_at IS NOT NULL
  `,
      [id_asignatura, anio],
    );

    // 3. Insertar en las secciones que NO tienen registro previo
    //    (ni activo ni soft-deleted — son secciones nuevas)
    const result = await run(
      `
    INSERT INTO rel_grado_asignatura (id_grado, id_asignatura)
    SELECT g.id, ?
    FROM grados g
    WHERE g.anio = ?
    AND NOT EXISTS (
      SELECT 1 FROM rel_grado_asignatura
      WHERE id_grado = g.id
      AND id_asignatura = ?
      -- Sin filtro deleted_at: si existe en cualquier estado, no insertar
    )
  `,
      [id_asignatura, anio, id_asignatura],
    );

    return { id_asignatura, anio, grados_afectados: result.changes };
  }

  static async deleteRelacion({ anio, asignatura }) {
    const getIdsSql = `
    SELECT rga.id 
    FROM rel_grado_asignatura rga
    JOIN asignaturas a ON rga.id_asignatura = a.id
    JOIN grados g ON rga.id_grado = g.id
    WHERE a.nombre = ? AND g.anio = ?
    AND rga.deleted_at IS NULL
  `;

    const relaciones = await all(getIdsSql, [asignatura, anio]);
    if (relaciones.length === 0) return false;

    const ids = relaciones.map((r) => r.id);
    const placeholders = ids.map(() => "?").join(",");

    // Soft delete en rel_asignatura_profesor (quitar profesor asignado)
    await run(
      `UPDATE rel_asignatura_profesor 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE id_rel_grado_asignatura IN (${placeholders})
     AND deleted_at IS NULL`,
      ids,
    );

    // Soft delete en rel_grado_asignatura (desactivar asignatura del pensum)
    const result = await run(
      `UPDATE rel_grado_asignatura 
     SET deleted_at = CURRENT_TIMESTAMP 
     WHERE id IN (${placeholders})
     AND deleted_at IS NULL`,
      ids,
    );

    return result.changes > 0;
  }
}
