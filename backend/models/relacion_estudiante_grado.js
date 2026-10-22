import { all, get, run } from "../src/db.js";

export class RelacionEstudianteGradoModel {
  static getAll({ filtrado }) {
    /**    if (filtrado?.anio === undefined && filtrado?.seccion === undefined) {
      const sql = `SELECT * FROM rel_estudiante_grado`;
      return all(sql);
    } */
    const { anio, seccion } = filtrado;
    console.log(anio, seccion);
    const sql = `
  SELECT
    rel_estudiante_grado.id AS id, 
    estudiantes.id AS id_estudiante,     
    estudiantes.nombre AS nombre,
    estudiantes.apellido AS apellido,
    estudiantes.cedula AS cedula,
    estudiantes.telefono AS telefono,
    estudiantes.correo AS correo,
    -- Cambio: datos oficiales para editar y exportar desde la vista de grado.
    estudiantes.lugar_nacimiento AS lugar_nacimiento,
    estudiantes.entidad_federal AS entidad_federal,
    grados.anio AS año,
    grados.seccion AS seccion
  FROM estudiantes
  INNER JOIN rel_estudiante_grado ON estudiantes.id = rel_estudiante_grado.id_estudiante
  INNER JOIN grados ON rel_estudiante_grado.id_grado = grados.id
  WHERE grados.anio = ? AND grados.seccion = ?
  AND rel_estudiante_grado.id_periodo = (
    SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1
  )
  AND rel_estudiante_grado.activo = 1          -- 👈 agrega esto
  AND rel_estudiante_grado.deleted_at IS NULL  -- 👈 y esto
`;

    return all(sql, [anio, seccion]);
  }
  // Cambio: la relacion nueva queda asociada al periodo activo.
  static createRelacion({ id_estudiante, id_grado }) {
    const periodo = get(
      `SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1`
    );
    if (!periodo) throw new Error("NO_PERIODO_ACTIVO");

        // Cambio: no se puede inscribir en un grado deshabilitado.
    const gradoDestino = get(`SELECT activo FROM grados WHERE id = ?`, [
      id_grado,
    ]);
    if (!gradoDestino) throw new Error("Grado no encontrado");
    if (gradoDestino.activo === 0) {
      throw new Error(
        "Este grado está deshabilitado. Habilítelo antes de inscribir estudiantes",
      );
    }

    const result = run(
      `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, id_periodo)
     VALUES (?, ?, ?)`,
      [id_estudiante, id_grado, periodo.id]
    );

    return {
      id: result.lastInsertRowid,
      id_estudiante,
      id_grado,
      id_periodo: periodo.id,
    };
  }
  //
  //
  static deleteRelacion({ id_estudiante }) {
    // Cambio: solo desactiva la relacion del periodo activo.
    const sql = `
    UPDATE rel_estudiante_grado
    SET activo = 0, deleted_at = CURRENT_TIMESTAMP
    WHERE id_estudiante = ?
    AND id_periodo = (SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1)
    AND activo = 1 AND deleted_at IS NULL
  `;
    const result = run(sql, [id_estudiante]);
    return result.changes > 0;
  }

  //
  //
  //
  static updateRelacion({ id, input, preservarNotas }) {
    const { id_estudiante, id_grado } = input;

    // 🔹 obtener relación actual
    const actual = get(`SELECT * FROM rel_estudiante_grado WHERE id = ?`, [id]);

    if (!actual) return false;

    // 🔹 obtener grado actual y nuevo
    const gradoActual = get(`SELECT * FROM grados WHERE id = ?`, [
      actual.id_grado,
    ]);

    const gradoNuevo = get(`SELECT * FROM grados WHERE id = ?`, [id_grado]);

        // Cambio: no se puede mover a un estudiante a un grado deshabilitado.
    if (gradoNuevo?.activo === 0 && id_grado !== actual.id_grado) {
      throw new Error(
        "Este grado está deshabilitado. Habilítelo antes de mover estudiantes",
      );
    }

    // 🔹 evitar duplicados
    const checkSql =
      "SELECT * FROM rel_estudiante_grado WHERE id_estudiante= ? AND id_grado=? AND id_periodo = ?";
    // Cambio: los duplicados se validan dentro del periodo de la relacion.
    const checkResult = get(checkSql, [
      id_estudiante,
      id_grado,
      actual.id_periodo,
    ]);

    if (checkResult && checkResult.id !== id) {
      throw new Error("Este estudiante ya se encuentra en este grado");
    }

    // =====================================================
    // 🔥 LÓGICA INTELIGENTE DE NOTAS
    // =====================================================

    if (preservarNotas && gradoActual.anio === gradoNuevo.anio) {
      // Cambio: solo se migran notas del periodo de la relacion editada.
      // ✅ MISMO AÑO → intentar migrar notas

      // 🔹 asignaturas del grado actual
      const asignaturasActual = all(
        `SELECT id, id_asignatura FROM rel_grado_asignatura WHERE id_grado = ?`,
        [actual.id_grado],
      );

      // 🔹 asignaturas del nuevo grado
      const asignaturasNuevo = all(
        `SELECT id, id_asignatura FROM rel_grado_asignatura WHERE id_grado = ?`,
        [id_grado],
      );

      // 🔹 mapa rápido
      const mapaNuevo = {};
      asignaturasNuevo.forEach((a) => {
        mapaNuevo[a.id_asignatura] = a.id;
      });

      // 🔹 migrar notas SOLO si coinciden
      asignaturasActual.forEach((a) => {
        const nuevoId = mapaNuevo[a.id_asignatura];

        if (nuevoId) {
          run(
            `UPDATE notas 
           SET id_rel_grado_asignatura = ? 
           WHERE id_rel_estudiante_grado = ? 
           AND id_rel_grado_asignatura = ?
           AND id_periodo = ?`,
            [nuevoId, id, a.id, actual.id_periodo],
          );
        } else {
          // ❌ si no existe en el nuevo → eliminar
          run(
            `DELETE FROM notas 
           WHERE id_rel_estudiante_grado = ? 
           AND id_rel_grado_asignatura = ?
           AND id_periodo = ?`,
            [id, a.id, actual.id_periodo],
          );
        }
      });
    } else {
      // ❌ distinto año o no preservar → eliminar todo
      run(
        `DELETE FROM notas WHERE id_rel_estudiante_grado = ? AND id_periodo = ?`,
        [id, actual.id_periodo],
      );
    }

    // =====================================================
    // 🔹 actualizar relación
    // =====================================================

    const sql =
      "UPDATE rel_estudiante_grado SET id_estudiante = ?, id_grado = ? WHERE id = ?";

    const result = run(sql, [id_estudiante, id_grado, id]);

    if (result.changes === 0) {
      return false;
    }

    return { id, ...input };
  }
}
