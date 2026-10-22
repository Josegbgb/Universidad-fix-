import { all, get, run, transaction } from "../src/db.js";

const NOTA_MINIMA = 10;
const MAX_PENDIENTES_PARA_AVANZAR = 2;

export class RevisionModel {
  static getEstudiantesRevision(id_periodo) {
    const estudiantes = all(
      `SELECT DISTINCT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         COALESCE(gu.anio, go.anio) AS anio,
         COALESCE(gu.seccion, 'U') AS seccion,
         COALESCE(gu.id, go.id) AS id_grado,
         CASE
           WHEN ep.estado = 'aprobado' THEN 'Aprobado'
           WHEN ep.estado = 'pendiente' THEN 'Aprobado con materias pendientes'
           WHEN ep.estado = 'reprobado' THEN 'Reprobado'
           ELSE 'En revision'
         END AS estado
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN estudiantes e ON e.id = eap.id_estudiante
       INNER JOIN grados go ON go.id = eap.id_grado_origen
       LEFT JOIN grados gu ON gu.anio = go.anio AND gu.seccion = 'U'
       LEFT JOIN estados_estudiante_periodo ep
         ON ep.id_estudiante = e.id
        AND ep.id_periodo = eap.id_periodo
       WHERE eap.id_periodo = ?
         AND eap.fase = 'revision'
         AND e.deleted_at IS NULL
       ORDER BY COALESCE(gu.anio, go.anio), COALESCE(gu.seccion, 'U'), e.apellido`,
      [id_periodo],
    );

    // Cambio: las materias se leen desde la fase revision del mismo periodo.
    return estudiantes.map((estudiante) => ({
      ...estudiante,
      materias: this._getMateriasRevision(estudiante.id_estudiante, id_periodo),
    }));
  }

  static getEstudiantesRevisionByProfesor({ userId, id_periodo }) {
    // Cambio: vista de profesor separada para notas de revision asignadas.
    const estudiantes = all(
      `SELECT DISTINCT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         COALESCE(gu.id, go.id) AS id_grado,
         go.anio,
         COALESCE(gu.seccion, 'U') AS seccion,
         CASE
           WHEN ep.estado = 'aprobado' THEN 'Aprobado'
           WHEN ep.estado = 'pendiente' THEN 'Aprobado con materias pendientes'
           WHEN ep.estado = 'reprobado' THEN 'Reprobado'
           ELSE 'En revision'
         END AS estado
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN estudiantes e ON e.id = eap.id_estudiante
       INNER JOIN grados go ON go.id = eap.id_grado_origen
       LEFT JOIN grados gu ON gu.anio = go.anio AND gu.seccion = 'U'
       LEFT JOIN estados_estudiante_periodo ep
         ON ep.id_estudiante = e.id
        AND ep.id_periodo = eap.id_periodo
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
         AND eap.fase = 'revision'
         AND e.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY COALESCE(gu.anio, go.anio), COALESCE(gu.seccion, 'U'), e.apellido`,
      [userId, id_periodo],
    );

    return estudiantes.map((estudiante) => ({
      ...estudiante,
      materias: this._getMateriasRevisionByProfesor(
        estudiante.id_estudiante,
        id_periodo,
        userId,
      ),
    }));
  }

  static getRevisionByEstudianteUserId({ userId }) {
    const estudiante = get(
      `SELECT id FROM estudiantes WHERE id_usuario = ? AND deleted_at IS NULL`,
      [userId],
    );
    if (!estudiante) return [];

    // Cambio: estudiante ve su proceso de revision separado de notas normales.
    return all(
      `SELECT
         pe.nombre AS periodo,
         gu.anio,
         gu.seccion,
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
         AND eap.fase = 'revision'
       ORDER BY pe.nombre DESC, go.anio, a.nombre`,
      [estudiante.id],
    );
  }

  static registrarNotaRevision({ id_pendiente, nota }) {
    // Cambio: "IN" (inasistente) se guarda como nota 0 con inasistente = 1.
    const esIN = typeof nota === "string" && nota.trim().toUpperCase() === "IN";
    if (!esIN && (nota === null || nota === undefined || Number.isNaN(Number(nota)))) {
      throw new Error("NOTA_REQUERIDA");
    }
    const valor = esIN ? null : Number(nota);

    const pendiente = get(
      `SELECT * FROM estudiante_asignatura_pendiente
       WHERE id = ? AND fase = 'revision'`,
      [id_pendiente],
    );
    if (!pendiente) throw new Error("PENDIENTE_NO_ENCONTRADO");

    // Cambio: la nota se puede registrar en la revision normal o en la especial.
    const faseAbierta = get(
      `SELECT fase FROM fases_periodo
       WHERE id_periodo = ?
         AND fase IN ('revision', 'revision_especial')
         AND abierta = 1`,
      [pendiente.id_periodo],
    );
    if (!faseAbierta) throw new Error("FASE_REVISION_CERRADA");

    const esEspecial = faseAbierta.fase === "revision_especial";
    // En la especial solo se editan las materias que siguen sin aprobar.
    if (esEspecial && pendiente.aprobada) throw new Error("MATERIA_YA_APROBADA");

    const aprobada = esIN ? 0 : valor >= NOTA_MINIMA ? 1 : 0;
    const aprobadaEnFase = aprobada
      ? esEspecial
        ? "revision_especial"
        : "revision"
      : null;

    run(
      `UPDATE estudiante_asignatura_pendiente
       SET revision_inicial = CASE
             WHEN ? = 1 AND revision_inicial IS NULL THEN
               CASE
                 WHEN inasistente = 1 THEN 'IN'
                 WHEN nota_obtenida IS NULL THEN 'SIN_NOTA'
                 ELSE CAST(nota_obtenida AS TEXT)
               END
             ELSE revision_inicial
           END,
           nota_obtenida = ?,
           inasistente = ?,
           aprobada = ?,
           aprobada_en_fase = ?
       WHERE id = ?`,
      [esEspecial ? 1 : 0, valor, esIN ? 1 : 0, aprobada, aprobadaEnFase, id_pendiente],
    );

    return { registrado: true, aprobada: aprobada === 1 };
  }

  static registrarNotaRevisionProfesor({ userId, id_pendiente, nota }) {
    if (!this._profesorPuedeEvaluarPendiente(userId, id_pendiente)) {
      throw new Error("PENDIENTE_NO_ASIGNADO_AL_PROFESOR");
    }

    return this.registrarNotaRevision({ id_pendiente, nota });
  }

  static evaluarResultadosRevision(id_periodo) {
    // Cambio: no escribe estados si la revision no esta lista para cerrar.
    const periodo = get(
      `SELECT id FROM periodos_escolares
       WHERE id = ? AND activo = 1 AND cerrado = 0`,
      [id_periodo],
    );
    if (!periodo) throw new Error("PERIODO_NO_VALIDO");

    const fase = get(
      `SELECT id FROM fases_periodo
      WHERE id_periodo = ? AND fase IN ('revision', 'revision_especial') AND abierta = 1`,
      [id_periodo],
    );
    if (!fase) throw new Error("FASE_REVISION_NO_ABIERTA");

    const sinNota = get(
      `SELECT COUNT(*) AS total
       FROM estudiante_asignatura_pendiente
       WHERE id_periodo = ?
         AND fase = 'revision'
         AND nota_obtenida IS NULL AND inasistente = 0`,
      [id_periodo],
    );
    if (sinNota.total > 0) {
      throw new Error("HAY_NOTAS_REVISION_PENDIENTES");
    }

    const estudiantes = all(
      `SELECT ep.id_estudiante, ep.id_grado
       FROM estados_estudiante_periodo ep
       WHERE ep.id_periodo = ? AND ep.estado = 'revision'`,
      [id_periodo],
    );

    const resultados = {
      aprobados: [],
      conPendientes: [],
      reprobados: [],
      errores: [],
    };

    // Cambio: revision marca estados; el movimiento ocurre al cerrar periodo.
    const evaluar = transaction(() => {
      for (const estudiante of estudiantes) {
        try {
          const materias = this._getMateriasReprobadas(
            estudiante.id_estudiante,
            id_periodo,
          );

          if (materias.length === 0) {
            // Cambio: si aprueba todo en revision avanza como aprobado, no como pendiente.
            this._registrarEstado(
              estudiante.id_estudiante,
              estudiante.id_grado,
              id_periodo,
              "aprobado",
            );
            resultados.aprobados.push({
              id_estudiante: estudiante.id_estudiante,
              cantidadPendientes: 0,
              materias: [],
            });
            continue;
          }

          if (materias.length <= MAX_PENDIENTES_PARA_AVANZAR) {
            this._registrarEstado(
              estudiante.id_estudiante,
              estudiante.id_grado,
              id_periodo,
              "pendiente",
            );
            resultados.conPendientes.push({
              id_estudiante: estudiante.id_estudiante,
              cantidadPendientes: materias.length,
              materias: materias.map((materia) => materia.asignatura),
            });
          } else {
            this._registrarEstado(
              estudiante.id_estudiante,
              estudiante.id_grado,
              id_periodo,
              "reprobado",
            );
            resultados.reprobados.push({
              id_estudiante: estudiante.id_estudiante,
              cantidadReprobadas: materias.length,
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
    });

    evaluar();
    return resultados;
  }

  static previewCierreRevision(id_periodo) {
    const periodo = get(`SELECT * FROM periodos_escolares WHERE id = ?`, [
      id_periodo,
    ]);
    if (!periodo) throw new Error("PERIODO_NO_ENCONTRADO");

    const estudiantes = all(
      `SELECT ep.id_estudiante, ep.id_grado, e.nombre, e.apellido, g.anio, g.seccion
       FROM estados_estudiante_periodo ep
       INNER JOIN estudiantes e ON e.id = ep.id_estudiante
       INNER JOIN grados g ON g.id = ep.id_grado
       WHERE ep.id_periodo = ? AND ep.estado = 'revision'
       ORDER BY g.anio, g.seccion, e.apellido`,
      [id_periodo],
    );

    const conPendientes = [];
    const aprobados = [];
    const reprobados = [];
    const errores = [];

    // Cambio: preview calcula el nuevo periodo sin escribir en BD.
    for (const estudiante of estudiantes) {
      try {
        const materias = this._getMateriasReprobadas(
          estudiante.id_estudiante,
          id_periodo,
        );
        const item = {
          ...estudiante,
          cantidadPendientes: materias.length,
          materias: materias.map((materia) => materia.asignatura),
        };

        if (materias.length === 0) {
          // Cambio: el preview separa quienes ya no arrastran pendientes.
          aprobados.push(item);
        } else if (materias.length <= MAX_PENDIENTES_PARA_AVANZAR) {
          conPendientes.push(item);
        } else {
          reprobados.push(item);
        }
      } catch (error) {
        errores.push({
          id_estudiante: estudiante.id_estudiante,
          error: error.message,
        });
      }
    }

    return {
      periodo,
      periodoNuevo: this._siguienteNombrePeriodo(periodo.nombre),
      aprobados,
      conPendientes,
      reprobados,
      errores,
    };
  }

  static _getMateriasRevision(id_estudiante, id_periodo) {
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
         AND eap.fase = 'revision'
       ORDER BY a.nombre`,
      [id_estudiante, id_periodo],
    );
  }

  static _getMateriasRevisionByProfesor(id_estudiante, id_periodo, userId) {
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
         AND eap.fase = 'revision'
         AND p.deleted_at IS NULL
       ORDER BY a.nombre`,
      [userId, id_estudiante, id_periodo],
    );
  }

  static _getMateriasReprobadas(id_estudiante, id_periodo) {
    return all(
      `SELECT
         eap.id_asignatura,
         a.nombre AS asignatura
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN asignaturas a ON a.id = eap.id_asignatura
       WHERE eap.id_estudiante = ?
         AND eap.id_periodo = ?
         AND eap.fase = 'revision'
         AND eap.aprobada = 0
       ORDER BY a.nombre`,
      [id_estudiante, id_periodo],
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

  static _profesorPuedeEvaluarPendiente(userId, id_pendiente) {
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
         AND eap.fase = 'revision'
         AND p.deleted_at IS NULL
       LIMIT 1`,
      [userId, id_pendiente],
    );

    return Boolean(permiso);
  }

  static _siguienteNombrePeriodo(nombre) {
    const [inicio, fin] = nombre.split("-").map((parte) => {
      return Number.parseInt(parte, 10);
    });
    if (Number.isNaN(inicio) || Number.isNaN(fin)) {
      throw new Error("FORMATO_PERIODO_INVALIDO");
    }
    return `${inicio + 1}-${fin + 1}`;
  }
}
