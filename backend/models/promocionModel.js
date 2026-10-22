import { all, get, run } from "../src/db.js";

export class PromocionModel {
  static evaluarEstudiante(id_estudiante) {
    const periodo = this._getPeriodoActivo();
    const rel = get(
      `SELECT reg.id, reg.id_grado, reg.id_periodo, g.anio, g.seccion
       FROM rel_estudiante_grado reg
       INNER JOIN grados g ON g.id = reg.id_grado
       WHERE reg.id_estudiante = ?
         AND reg.id_periodo = ?
         AND reg.activo = 1
         AND reg.deleted_at IS NULL`,
      [id_estudiante, periodo.id],
    );

    if (!rel) return { puede: false, razon: "Sin grado activo" };

    // Cambio: evaluacion legacy filtra notas por el periodo activo.
    const asignaturas = all(
      `SELECT
         a.id AS id_asignatura,
         a.nombre,
         AVG(COALESCE(n.nota, 0)) AS definitiva,
         COUNT(l.id) AS total_lapsos,
         SUM(CASE WHEN n.nota IS NOT NULL THEN 1 ELSE 0 END) AS lapsos_con_nota
       FROM rel_grado_asignatura rga
       INNER JOIN asignaturas a ON a.id = rga.id_asignatura
       CROSS JOIN lapsos l
       LEFT JOIN notas n ON n.id_rel_grado_asignatura = rga.id
         AND n.id_rel_estudiante_grado = ?
         AND n.id_lapso = l.id
         AND n.id_periodo = ?
       WHERE rga.id_grado = ?
       GROUP BY a.id`,
      [rel.id, periodo.id, rel.id_grado],
    );

    const reprobadas = asignaturas.filter((asignatura) => {
      const sinNotas = asignatura.lapsos_con_nota === 0;
      const incompleto = asignatura.lapsos_con_nota < asignatura.total_lapsos;
      const reprobado = asignatura.definitiva < 10;
      return sinNotas || incompleto || reprobado;
    });

    const cantidadReprobadas = reprobadas.length;

    return {
      puede: cantidadReprobadas <= 2,
      arrastre: cantidadReprobadas > 0 && cantidadReprobadas <= 2,
      repite: cantidadReprobadas >= 3,
      cantidadReprobadas,
      anio_actual: rel.anio,
      seccion: rel.seccion,
      id_grado_actual: rel.id_grado,
      id_periodo: rel.id_periodo,
      id_rel: rel.id,
      asignaturas,
      reprobadas,
    };
  }

  static promoverEstudiante(id_estudiante) {
    const periodo = this._getPeriodoActivo();
    const evaluacion = this.evaluarEstudiante(id_estudiante);
    const { asignaturas } = evaluacion;

    if (!asignaturas || asignaturas.length === 0) {
      return { puede: false, razon: "SIN_ASIGNATURAS" };
    }

    const { anio_actual, seccion, id_rel, id_grado_actual } = evaluacion;
    const { arrastre, repite, reprobadas } = evaluacion;

    if (repite) {
      run(
        `UPDATE rel_estudiante_grado
         SET activo = 0, deleted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_rel],
      );

      run(
        `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, activo, id_periodo)
         VALUES (?, ?, 1, ?)`,
        [id_estudiante, id_grado_actual, periodo.id],
      );

      return { repetido: true, anio: anio_actual, seccion };
    }

    if (arrastre) {
      run(`INSERT OR IGNORE INTO grados (anio, seccion) VALUES (?, 'U')`, [anio_actual]);
      for (const materia of reprobadas) {
        run(
          `INSERT OR IGNORE INTO estudiante_asignatura_pendiente
             (id_estudiante, id_asignatura, id_grado_origen, id_periodo, fase, aprobada)
           VALUES (?, ?, ?, ?, 'pendiente_oct', 0)`,
          [id_estudiante, materia.id_asignatura, id_grado_actual, periodo.id],
        );
      }
    }

    if (anio_actual === 5) {
      run(
        `UPDATE rel_estudiante_grado
         SET activo = 0, deleted_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id_rel],
      );
      run(`UPDATE estudiantes SET egresado = 1 WHERE id = ?`, [id_estudiante]);
      return { egresado: true, anio_anterior: 5 };
    }

    const siguienteGrado = get(
      `SELECT id FROM grados WHERE anio = ? AND seccion = ?`,
      [anio_actual + 1, seccion],
    );
    if (!siguienteGrado) throw new Error("GRADO_SIGUIENTE_NO_EXISTE");
        // Cambio: si el grado destino estaba deshabilitado, se habilita automaticamente.
    run(`UPDATE grados SET activo = 1 WHERE id = ? AND activo = 0`, [
      siguienteGrado.id,
    ]);

    run(
      `UPDATE rel_estudiante_grado
       SET activo = 0, deleted_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [id_rel],
    );
    run(
      `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, activo, id_periodo)
       VALUES (?, ?, 1, ?)`,
      [id_estudiante, siguienteGrado.id, periodo.id],
    );

    return {
      egresado: false,
      anio_anterior: anio_actual,
      anio_nuevo: anio_actual + 1,
    };
  }

  static revertirPromocion(id_estudiante) {
    const periodo = this._getPeriodoActivo();
    const relActual = get(
      `SELECT id FROM rel_estudiante_grado
       WHERE id_estudiante = ?
         AND id_periodo = ?
         AND activo = 1
         AND deleted_at IS NULL`,
      [id_estudiante, periodo.id],
    );

    const relAnterior = get(
      `SELECT id FROM rel_estudiante_grado
       WHERE id_estudiante = ?
         AND id_periodo = ?
         AND activo = 0
         AND deleted_at IS NOT NULL
       ORDER BY deleted_at DESC LIMIT 1`,
      [id_estudiante, periodo.id],
    );

    if (!relAnterior) throw new Error("NO_HAY_PROMOCION_PARA_REVERTIR");

    if (relActual) {
      run(`DELETE FROM rel_estudiante_grado WHERE id = ?`, [relActual.id]);
    }

    run(
      `UPDATE rel_estudiante_grado
       SET activo = 1, deleted_at = NULL
       WHERE id = ?`,
      [relAnterior.id],
    );
    run(`UPDATE estudiantes SET egresado = 0 WHERE id = ?`, [id_estudiante]);

    return { revertido: true };
  }

  static promoverTodos() {
    const periodo = this._getPeriodoActivo();
    const estudiantes = all(
      `SELECT e.id
       FROM estudiantes e
       INNER JOIN rel_estudiante_grado reg ON reg.id_estudiante = e.id
       WHERE reg.id_periodo = ?
         AND reg.activo = 1
         AND reg.deleted_at IS NULL
         AND e.deleted_at IS NULL
         AND e.egresado = 0`,
      [periodo.id],
    );

    const resultados = {
      promovidos: [],
      repitentes: [],
      egresados: [],
      errores: [],
    };

    for (const estudiante of estudiantes) {
      try {
        const evaluacion = this.evaluarEstudiante(estudiante.id);

        if (evaluacion.puede) {
          const res = this.promoverEstudiante(estudiante.id);
          if (res.egresado) {
            resultados.egresados.push(estudiante.id);
          } else {
            resultados.promovidos.push(estudiante.id);
          }
        } else {
          run(
            `UPDATE rel_estudiante_grado
             SET activo = 0, deleted_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [evaluacion.id_rel],
          );
          run(
            `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, activo, id_periodo)
             VALUES (?, ?, 1, ?)`,
            [estudiante.id, evaluacion.id_grado_actual, periodo.id],
          );
          resultados.repitentes.push(estudiante.id);
        }
      } catch (error) {
        resultados.errores.push({ id: estudiante.id, error: error.message });
      }
    }

    return resultados;
  }

  static revertirTodos() {
    const periodo = this._getPeriodoActivo();
    const estudiantes = all(
      `SELECT DISTINCT e.id
       FROM estudiantes e
       INNER JOIN rel_estudiante_grado reg ON reg.id_estudiante = e.id
       WHERE reg.id_periodo = ?
         AND reg.deleted_at IS NOT NULL
         AND e.deleted_at IS NULL
         AND e.egresado = 0`,
      [periodo.id],
    );

    const resultados = { revertidos: [], errores: [] };

    for (const estudiante of estudiantes) {
      try {
        this.revertirPromocion(estudiante.id);
        resultados.revertidos.push(estudiante.id);
      } catch (error) {
        if (error.message !== "NO_HAY_PROMOCION_PARA_REVERTIR") {
          resultados.errores.push({
            id: estudiante.id,
            error: error.message,
          });
        }
      }
    }

    return resultados;
  }

  static _getPeriodoActivo() {
    // Cambio: promociones legacy usan periodo activo para id_periodo obligatorio.
    const periodo = get(
      `SELECT id FROM periodos_escolares WHERE activo = 1 LIMIT 1`,
    );
    if (!periodo) throw new Error("NO_PERIODO_ACTIVO");
    return periodo;
  }
}
