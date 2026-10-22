import { all, get, run, transaction } from "../src/db.js";
import { PeriodoModel } from "./periodoModel.js";

const NOTA_MINIMA = 10;

export class FinalizacionModel {
  static evaluarEstudiante(id_estudiante, id_periodo) {
    const rel = get(
      `SELECT reg.id, reg.id_grado, g.anio, g.seccion
       FROM rel_estudiante_grado reg
       INNER JOIN grados g ON g.id = reg.id_grado
       WHERE reg.id_estudiante = ?
         AND reg.id_periodo = ?
         AND reg.activo = 1
         AND reg.deleted_at IS NULL`,
      [id_estudiante, id_periodo],
    );

    if (!rel) return { puede: false, razon: "SIN_GRADO_EN_PERIODO" };

    // Cambio: la definitiva se calcula en el periodo escolar evaluado.
    const asignaturas = all(
      `SELECT a.id AS id_asignatura,
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
      WHERE rga.id_grado = ? AND rga.deleted_at IS NULL
      GROUP BY a.id`,
      [rel.id, id_periodo, rel.id_grado],
    );

    const reprobadas = asignaturas.filter(
      (asignatura) =>
        asignatura.lapsos_con_nota === 0 ||
        asignatura.definitiva < NOTA_MINIMA,
    );

    return {
      id_estudiante,
      id_periodo,
      id_rel: rel.id,
      id_grado: rel.id_grado,
      anio: rel.anio,
      seccion: rel.seccion,
      asignaturas,
      reprobadas,
      cantidadReprobadas: reprobadas.length,
      aprobado: reprobadas.length === 0,
    };
  }

  static previewCierre(id_periodo) {
    const periodo = get(
      `SELECT * FROM periodos_escolares
       WHERE id = ? AND activo = 1 AND cerrado = 0`,
      [id_periodo],
    );
    if (!periodo) throw new Error("PERIODO_NO_VALIDO");

    const fase = get(
      `SELECT * FROM fases_periodo
       WHERE id_periodo = ? AND fase = 'finalizacion' AND abierta = 1`,
      [id_periodo],
    );
    if (!fase) throw new Error("FASE_FINALIZACION_NO_ABIERTA");

    const estudiantes = all(
      `SELECT e.id, e.nombre, e.apellido
       FROM estudiantes e
       INNER JOIN rel_estudiante_grado reg ON reg.id_estudiante = e.id
       WHERE reg.id_periodo = ?
         AND reg.activo = 1
         AND reg.deleted_at IS NULL
         AND e.deleted_at IS NULL
         AND e.egresado = 0`,
      [id_periodo],
    );

    const aprobados = [];
    const paraRevision = [];
    const errores = [];

    // Cambio: el preview es solo lectura y reutiliza la evaluacion individual.
    for (const estudiante of estudiantes) {
      try {
        const evaluacion = this.evaluarEstudiante(estudiante.id, id_periodo);
        const item = {
          id_estudiante: estudiante.id,
          nombre: estudiante.nombre,
          apellido: estudiante.apellido,
          anio: evaluacion.anio,
          seccion: evaluacion.seccion,
          cantidadReprobadas: evaluacion.cantidadReprobadas,
          reprobadas: evaluacion.reprobadas.map((materia) => materia.nombre),
        };

        if (evaluacion.aprobado) {
          aprobados.push(item);
        } else {
          paraRevision.push(item);
        }
      } catch (error) {
        errores.push({ id_estudiante: estudiante.id, error: error.message });
      }
    }

    return {
      periodo,
      total: estudiantes.length,
      aprobados: aprobados.length,
      paraRevision: paraRevision.length,
      detalle: { aprobados, paraRevision, errores },
    };
  }

  static cerrarFinalizacion(id_periodo) {
    const periodo = get(
      `SELECT * FROM periodos_escolares
       WHERE id = ? AND activo = 1 AND cerrado = 0`,
      [id_periodo],
    );
    if (!periodo) throw new Error("PERIODO_NO_VALIDO");

    const fase = get(
      `SELECT * FROM fases_periodo
       WHERE id_periodo = ? AND fase = 'finalizacion' AND abierta = 1`,
      [id_periodo],
    );
    if (!fase) throw new Error("FASE_FINALIZACION_NO_ABIERTA");

    const estudiantes = all(
      `SELECT e.id, e.nombre, e.apellido
       FROM estudiantes e
       INNER JOIN rel_estudiante_grado reg ON reg.id_estudiante = e.id
       WHERE reg.id_periodo = ?
         AND reg.activo = 1
         AND reg.deleted_at IS NULL
         AND e.deleted_at IS NULL
         AND e.egresado = 0`,
      [id_periodo],
    );

    const resultados = {
      aprobados: [],
      paraRevision: [],
      egresados: [],
      errores: [],
    };

    // Cambio: cierre final registra estados y abre revision automaticamente.
    const procesarCierre = transaction(() => {
      for (const estudiante of estudiantes) {
        try {
          const evaluacion = this.evaluarEstudiante(estudiante.id, id_periodo);

          if (evaluacion.aprobado) {
            this._registrarEstado(
              estudiante.id,
              evaluacion.id_grado,
              id_periodo,
              "aprobado",
            );

            if (evaluacion.anio === 5) {
              run(`UPDATE estudiantes SET egresado = 1 WHERE id = ?`, [
                estudiante.id,
              ]);
              run(
                `UPDATE rel_estudiante_grado
                 SET activo = 0, deleted_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [evaluacion.id_rel],
              );
              resultados.egresados.push({ id_estudiante: estudiante.id });
            } else {
              resultados.aprobados.push({ id_estudiante: estudiante.id });
            }
          } else {
            const gradoRevision = this._getOrCreateGradoU(evaluacion.anio);
            this._registrarEstado(
              estudiante.id,
              gradoRevision.id,
              id_periodo,
              "revision",
            );

            for (const materia of evaluacion.reprobadas) {
              run(
                `INSERT OR IGNORE INTO estudiante_asignatura_pendiente
                   (id_estudiante, id_asignatura, id_grado_origen, id_periodo, fase, aprobada)
                 VALUES (?, ?, ?, ?, 'revision', 0)`,
                [
                  estudiante.id,
                  materia.id_asignatura,
                  evaluacion.id_grado,
                  id_periodo,
                ],
              );
            }

            resultados.paraRevision.push({
              id_estudiante: estudiante.id,
              materias: evaluacion.reprobadas.map((materia) => materia.nombre),
            });
          }
        } catch (error) {
          resultados.errores.push({
            id_estudiante: estudiante.id,
            error: error.message,
          });
        }
      }

      run(
        `UPDATE fases_periodo
         SET abierta = 0, cerrada_at = CURRENT_TIMESTAMP
         WHERE id_periodo = ? AND fase = 'finalizacion'`,
        [id_periodo],
      );

      // Cambio: revision solo abre si alguien realmente tiene materias reprobadas.
      if (resultados.paraRevision.length > 0) {
        run(
          `UPDATE fases_periodo
           SET abierta = 1
           WHERE id_periodo = ? AND fase = 'revision'`,
          [id_periodo],
        );
      }
    });

    procesarCierre();

    // Cambio: si nadie necesita revision, se avanza directo al siguiente periodo.
    if (resultados.paraRevision.length === 0) {
      resultados.avance = PeriodoModel.avanzarSiguientePeriodo(id_periodo);
    }

    return resultados;
  }

  static getEstudiantesFinalizacion(id_periodo) {
    // Cambio: finalizacion excluye la seccion U de materias pendientes.
    return all(
      `SELECT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         g.id AS id_grado,
         g.anio,
         g.seccion,
         reg.id AS id_rel_estudiante_grado,
         CASE
           WHEN EXISTS (
             SELECT 1 FROM estudiante_asignatura_pendiente eap
             WHERE eap.id_estudiante = e.id
               AND eap.id_periodo = reg.id_periodo
               AND eap.fase = 'revision'
           ) THEN 'Pasa a revision'
           WHEN ep.estado = 'aprobado' THEN 'Aprobado'
           ELSE 'Por evaluar'
         END AS estado
       FROM rel_estudiante_grado reg
       INNER JOIN estudiantes e ON e.id = reg.id_estudiante
       INNER JOIN grados g ON g.id = reg.id_grado
       LEFT JOIN estados_estudiante_periodo ep
         ON ep.id_estudiante = e.id
        AND ep.id_periodo = reg.id_periodo
       WHERE reg.id_periodo = ?
         AND e.deleted_at IS NULL
         AND g.seccion <> 'U'
       ORDER BY g.anio, g.seccion, e.apellido`,
      [id_periodo],
    );
  }

  static _registrarEstado(id_estudiante, id_grado, id_periodo, estado) {
    run(
      `INSERT INTO estados_estudiante_periodo
         (id_estudiante, id_grado, id_periodo, estado)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id_estudiante, id_periodo)
       DO UPDATE SET estado = excluded.estado`,
      [id_estudiante, id_grado, id_periodo, estado],
    );
  }

  static _getOrCreateGradoU(anio) {
    // Cambio: la seccion U de revision se crea solo si hay estudiantes para revision.
    run(`INSERT OR IGNORE INTO grados (anio, seccion) VALUES (?, 'U')`, [anio]);
    return get(`SELECT id, anio, seccion FROM grados WHERE anio = ? AND seccion = 'U'`, [
      anio,
    ]);
  }
}
