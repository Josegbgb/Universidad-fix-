import { all, get, run, transaction } from "../src/db.js";

const NOTA_MINIMA = 10;
const SECUENCIA_FASES = [
  "pendiente_oct",
  "pendiente_dic",
  "pendiente_ene",
  "pendiente_jun",
];

export class PendienteModel {
  static getEstudiantesPorFase(id_periodo, fase) {
    this._validarFase(fase);

    const estudiantes = all(
      `SELECT DISTINCT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         COALESCE(gu.anio, go.anio) AS anio,
         COALESCE(gu.seccion, 'U') AS seccion,
         COALESCE(gu.id, eap.id_grado_origen) AS id_grado,
         CASE
           WHEN SUM(CASE WHEN eap.aprobada = 0 THEN 1 ELSE 0 END) > 0
             THEN 'Con materias pendientes'
           ELSE 'Aprobado en fase'
         END AS estado
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN estudiantes e ON e.id = eap.id_estudiante
       INNER JOIN grados go ON go.id = eap.id_grado_origen
       LEFT JOIN grados gu ON gu.anio = go.anio AND gu.seccion = 'U'
       WHERE eap.id_periodo = ?
         AND eap.fase = ?
         AND e.deleted_at IS NULL
       GROUP BY
         e.id,
         e.nombre,
         e.apellido,
         e.cedula,
         COALESCE(gu.anio, go.anio),
         COALESCE(gu.seccion, 'U'),
         COALESCE(gu.id, eap.id_grado_origen)
       ORDER BY COALESCE(gu.anio, go.anio), COALESCE(gu.seccion, 'U'), e.apellido`,
      [id_periodo, fase],
    );

    // Cambio: cada estudiante incluye solo materias aun no aprobadas.
    return estudiantes.map((estudiante) => ({
      ...estudiante,
      materias: this._getMateriasPorFase(
        estudiante.id_estudiante,
        id_periodo,
        fase,
      ),
    }));
  }

  static registrarNota({ id_pendiente, nota, fase }) {
    this._validarFase(fase);
    // Cambio: "IN" (inasistente) se guarda como nota 0 con inasistente = 1.
    const esIN = typeof nota === "string" && nota.trim().toUpperCase() === "IN";
    if (!esIN && (nota === null || nota === undefined || Number.isNaN(Number(nota)))) {
      throw new Error("NOTA_REQUERIDA");
    }
    const valor = esIN ? null : Number(nota);

    const pendiente = get(
      `SELECT * FROM estudiante_asignatura_pendiente
       WHERE id = ? AND fase = ?`,
      [id_pendiente, fase],
    );
    if (!pendiente) throw new Error("PENDIENTE_NO_ENCONTRADO");
    if (pendiente.aprobada) throw new Error("MATERIA_YA_APROBADA");

    const faseBD = get(
      `SELECT abierta FROM fases_periodo
       WHERE id_periodo = ? AND fase = ?`,
      [pendiente.id_periodo, fase],
    );
    if (!faseBD?.abierta) throw new Error("FASE_PENDIENTE_CERRADA");

    const aprobada = esIN ? 0 : valor >= NOTA_MINIMA ? 1 : 0;

    run(
      `UPDATE estudiante_asignatura_pendiente
       SET nota_obtenida = ?,
           inasistente = ?,
           aprobada = ?,
           aprobada_en_fase = ?
       WHERE id = ?`,
      [valor, esIN ? 1 : 0, aprobada, aprobada ? fase : null, id_pendiente],
    );

    return { registrado: true, aprobada: aprobada === 1 };
  }

  static getEstudiantesPorFaseByProfesor({ userId, id_periodo, fase }) {
    this._validarFase(fase);

    // Cambio: vista de profesor separada para materias pendientes asignadas.
    const estudiantes = all(
      `SELECT DISTINCT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         COALESCE(gu.id, go.id) AS id_grado,
         COALESCE(gu.anio, go.anio) AS anio,
         COALESCE(gu.seccion, 'U') AS seccion
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN estudiantes e ON e.id = eap.id_estudiante
       INNER JOIN grados go ON go.id = eap.id_grado_origen
       LEFT JOIN grados gu ON gu.anio = go.anio AND gu.seccion = 'U'
       INNER JOIN profesores p ON p.id_usuario = ?
       INNER JOIN rel_grado_asignatura rga
         ON rga.id_grado = eap.id_grado_origen
        AND rga.id_asignatura = eap.id_asignatura
        AND rga.deleted_at IS NULL
       INNER JOIN rel_asignatura_profesor rap
         ON rap.id_rel_grado_asignatura = rga.id
        AND rap.id_profesor = p.id
        AND rap.deleted_at IS NULL
       WHERE eap.id_periodo = ?
         AND eap.fase = ?
         AND eap.aprobada = 0
         AND e.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY COALESCE(gu.anio, go.anio), COALESCE(gu.seccion, 'U'), e.apellido`,
      [userId, id_periodo, fase],
    );

    return estudiantes.map((estudiante) => ({
      ...estudiante,
      materias: this._getMateriasPorFaseByProfesor(
        estudiante.id_estudiante,
        id_periodo,
        fase,
        userId,
      ),
    }));
  }

  static registrarNotaProfesor({ userId, id_pendiente, nota, fase }) {
    if (!this._profesorPuedeEvaluarPendiente(userId, id_pendiente, fase)) {
      throw new Error("PENDIENTE_NO_ASIGNADO_AL_PROFESOR");
    }

    return this.registrarNota({ id_pendiente, nota, fase });
  }

  static getPendientesByEstudianteUserId({ userId }) {
    const estudiante = get(
      `SELECT id FROM estudiantes WHERE id_usuario = ? AND deleted_at IS NULL`,
      [userId],
    );
    if (!estudiante) return [];

    // Cambio: estudiante ve materias pendientes separadas de notas normales.
    return all(
      `SELECT
         pe.nombre AS periodo,
         COALESCE(gu.anio, go.anio) AS anio,
         COALESCE(gu.seccion, 'U') AS seccion,
         eap.fase,
         a.nombre AS asignatura,
         eap.nota_obtenida,
         eap.aprobada,
         eap.aprobada_en_fase
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN periodos_escolares pe ON pe.id = eap.id_periodo
       INNER JOIN grados go ON go.id = eap.id_grado_origen
       LEFT JOIN grados gu ON gu.anio = go.anio AND gu.seccion = 'U'
       INNER JOIN asignaturas a ON a.id = eap.id_asignatura
       WHERE eap.id_estudiante = ?
         AND eap.fase LIKE 'pendiente_%'
       ORDER BY pe.nombre DESC, eap.fase, a.nombre`,
      [estudiante.id],
    );
  }

  static cerrarFasePendiente(id_periodo, fase) {
    this._validarFase(fase);

    const faseBD = get(
      `SELECT * FROM fases_periodo
       WHERE id_periodo = ? AND fase = ? AND abierta = 1`,
      [id_periodo, fase],
    );
    if (!faseBD) throw new Error("FASE_NO_ABIERTA");

    const estudiantes = all(
      `SELECT DISTINCT id_estudiante, id_grado_origen AS id_grado
       FROM estudiante_asignatura_pendiente
       WHERE id_periodo = ?
         AND fase = ?
         AND aprobada = 0`,
      [id_periodo, fase],
    );

    const siguienteFase = this._siguienteFase(fase);
    const resultados = {
      fase,
      avanzanAlSiguiente: [],
      repruebanDefinitivo: [],
      errores: [],
    };

    // Cambio: el cierre propaga solo materias no aprobadas.
    const cerrar = transaction(() => {
      for (const estudiante of estudiantes) {
        try {
          const materias = this._getMateriasPorFase(
            estudiante.id_estudiante,
            id_periodo,
            fase,
          );

          if (siguienteFase) {
            for (const materia of materias) {
              run(
                `INSERT OR IGNORE INTO estudiante_asignatura_pendiente
                   (id_estudiante, id_asignatura, id_grado_origen, id_periodo, fase, aprobada)
                 VALUES (?, ?, ?, ?, ?, 0)`,
                [
                  estudiante.id_estudiante,
                  materia.id_asignatura,
                  estudiante.id_grado,
                  id_periodo,
                  siguienteFase,
                ],
              );
            }

            resultados.avanzanAlSiguiente.push({
              id_estudiante: estudiante.id_estudiante,
              siguienteFase,
              materias: materias.map((materia) => materia.asignatura),
            });
          } else {
            this._registrarEstado(
              estudiante.id_estudiante,
              estudiante.id_grado,
              id_periodo,
              "reprobado",
            );

            resultados.repruebanDefinitivo.push({
              id_estudiante: estudiante.id_estudiante,
              materias: materias.map((materia) => materia.asignatura),
            });
          }
        } catch (error) {
          resultados.errores.push({
            id_estudiante: estudiante.id_estudiante,
            error: error.message,
          });
        }
      }

      run(
        `UPDATE fases_periodo
         SET abierta = 0, cerrada_at = CURRENT_TIMESTAMP
         WHERE id_periodo = ? AND fase = ?`,
        [id_periodo, fase],
      );

       // Cambio: la siguiente fase de pendientes solo abre si alguien la necesita.
      if (siguienteFase && resultados.avanzanAlSiguiente.length > 0) {
        run(
          `UPDATE fases_periodo
           SET abierta = 1
           WHERE id_periodo = ? AND fase = ?`,
          [id_periodo, siguienteFase],
        );
      }
    });

    cerrar();
    return resultados;
  }

  static getHistorialPendientes(id_estudiante) {
    // Cambio: el historial incluye periodo, asignatura y grado origen.
    return all(
      `SELECT
         eap.id,
         pe.nombre AS periodo,
         a.nombre AS asignatura,
         g.anio,
         g.seccion,
         eap.fase,
         eap.nota_obtenida,
         eap.aprobada,
         eap.aprobada_en_fase,
         eap.created_at
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN periodos_escolares pe ON pe.id = eap.id_periodo
       INNER JOIN asignaturas a ON a.id = eap.id_asignatura
       INNER JOIN grados g ON g.id = eap.id_grado_origen
       WHERE eap.id_estudiante = ?
       ORDER BY pe.nombre, eap.fase, a.nombre`,
      [id_estudiante],
    );
  }

  static _getMateriasPorFase(id_estudiante, id_periodo, fase) {
    return all(
      `SELECT
         eap.id,
         a.id AS id_asignatura,
         a.nombre AS asignatura,
         eap.nota_obtenida,
         eap.aprobada,
         eap.aprobada_en_fase
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN asignaturas a ON a.id = eap.id_asignatura
       WHERE eap.id_estudiante = ?
         AND eap.id_periodo = ?
         AND eap.fase = ?
         AND eap.aprobada = 0
       ORDER BY a.nombre`,
      [id_estudiante, id_periodo, fase],
    );
  }

  static _getMateriasPorFaseByProfesor(id_estudiante, id_periodo, fase, userId) {
    return all(
      `SELECT
         eap.id,
         a.id AS id_asignatura,
         a.nombre AS asignatura,
         eap.nota_obtenida,
         eap.aprobada,
         eap.aprobada_en_fase
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN asignaturas a ON a.id = eap.id_asignatura
       INNER JOIN profesores p ON p.id_usuario = ?
       INNER JOIN rel_grado_asignatura rga
         ON rga.id_grado = eap.id_grado_origen
        AND rga.id_asignatura = eap.id_asignatura
        AND rga.deleted_at IS NULL
       INNER JOIN rel_asignatura_profesor rap
         ON rap.id_rel_grado_asignatura = rga.id
        AND rap.id_profesor = p.id
        AND rap.deleted_at IS NULL
       WHERE eap.id_estudiante = ?
         AND eap.id_periodo = ?
         AND eap.fase = ?
         AND eap.aprobada = 0
         AND p.deleted_at IS NULL
       ORDER BY a.nombre`,
      [userId, id_estudiante, id_periodo, fase],
    );
  }

  static _siguienteFase(fase) {
    const index = SECUENCIA_FASES.indexOf(fase);
    if (index === -1) throw new Error("FASE_INVALIDA");
    return SECUENCIA_FASES[index + 1] ?? null;
  }

  static _validarFase(fase) {
    if (!SECUENCIA_FASES.includes(fase)) throw new Error("FASE_INVALIDA");
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

  static _profesorPuedeEvaluarPendiente(userId, id_pendiente, fase) {
    const permiso = get(
      `SELECT 1 AS permitido
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN profesores p ON p.id_usuario = ?
       INNER JOIN rel_grado_asignatura rga
         ON rga.id_grado = eap.id_grado_origen
        AND rga.id_asignatura = eap.id_asignatura
        AND rga.deleted_at IS NULL
       INNER JOIN rel_asignatura_profesor rap
         ON rap.id_rel_grado_asignatura = rga.id
        AND rap.id_profesor = p.id
        AND rap.deleted_at IS NULL
       WHERE eap.id = ?
         AND eap.fase = ?
         AND p.deleted_at IS NULL
       LIMIT 1`,
      [userId, id_pendiente, fase],
    );

    return Boolean(permiso);
  }
}
