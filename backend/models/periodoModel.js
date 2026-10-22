import { all, get, run, transaction } from "../src/db.js";

const FASES_PERIODO = [
  "finalizacion",
  "revision",
  "revision_especial",
  "pendiente_oct",
  "pendiente_dic",
  "pendiente_ene",
  "pendiente_jun",
];

export class PeriodoModel {
  static getAll() {
    return all(`SELECT * FROM periodos_escolares ORDER BY created_at DESC`);
  }

  static getById(id) {
    return get(`SELECT * FROM periodos_escolares WHERE id = ?`, [id]);
  }

  static getActivo() {
    return get(`SELECT * FROM periodos_escolares WHERE activo = 1 LIMIT 1`);
  }

  static getFasesByPeriodo(id_periodo) {
    return all(`SELECT * FROM fases_periodo WHERE id_periodo = ?`, [
      id_periodo,
    ]);
  }

  static getFase(id_periodo, fase) {
    return get(
      `SELECT * FROM fases_periodo WHERE id_periodo = ? AND fase = ?`,
      [id_periodo, fase],
    );
  }

  static getResumen(id_periodo) {
    const periodo = this.getById(id_periodo);
    if (!periodo) throw new Error("PERIODO_NO_ENCONTRADO");

    const fases = this.getFasesByPeriodo(id_periodo);
    const conteos = all(
      `SELECT estado, COUNT(*) AS total
       FROM estados_estudiante_periodo
       WHERE id_periodo = ?
       GROUP BY estado`,
      [id_periodo],
    );

    return { ...periodo, fases, conteos };
  }

  static crear({ nombre, fecha_inicio, fecha_fin }) {
    if (!/^\d{4}-\d{4}$/.test(nombre)) {
      throw new Error("NOMBRE_PERIODO_INVALIDO");
    }

    const periodoActivo = this.getActivo();
    if (periodoActivo) throw new Error("YA_EXISTE_PERIODO_ACTIVO");

    const periodoExistente = get(
      `SELECT id FROM periodos_escolares WHERE nombre = ?`,
      [nombre],
    );
    if (periodoExistente) throw new Error("PERIODO_YA_EXISTE");

    // Cambio: el periodo no crea estructura academica; solo inicializa sus fases.
    const crearPeriodo = transaction(() => {
      const result = run(
        `INSERT INTO periodos_escolares (nombre, fecha_inicio, fecha_fin, activo, cerrado)
         VALUES (?, ?, ?, 1, 0)`,
        [nombre, fecha_inicio ?? null, fecha_fin ?? null],
      );

      const id_periodo = result.lastInsertRowid;
      this._crearFases(id_periodo);

      return this.getById(id_periodo);
    });

    return crearPeriodo();
  }

  static activar(id_periodo) {
    const periodo = this.getById(id_periodo);
    if (!periodo) throw new Error("PERIODO_NO_ENCONTRADO");
    if (periodo.cerrado) throw new Error("PERIODO_YA_CERRADO");

    // Cambio: permite activar manualmente un periodo inicial sin tocar el schema.
    const activarPeriodo = transaction(() => {
      run(`UPDATE periodos_escolares SET activo = 0 WHERE activo = 1`);
      run(`UPDATE periodos_escolares SET activo = 1 WHERE id = ?`, [
        id_periodo,
      ]);

      const fases = this.getFasesByPeriodo(id_periodo);
      if (fases.length === 0) this._crearFases(id_periodo);

      return this.getById(id_periodo);
    });

    return activarPeriodo();
  }

  static cerrarFase(id_periodo, fase) {
    if (fase === "revision" || fase === "revision_especial") {
      throw new Error("USA_CERRAR_REVISION_Y_NUEVO_PERIODO");
    }

    const periodo = this.getById(id_periodo);
    if (!periodo) throw new Error("PERIODO_NO_ENCONTRADO");
    if (periodo.cerrado) throw new Error("PERIODO_YA_CERRADO");

    const faseBD = this.getFase(id_periodo, fase);
    if (!faseBD) throw new Error("FASE_NO_ENCONTRADA");
    if (!faseBD.abierta) throw new Error("FASE_YA_CERRADA");

    // Cambio: finalizacion abre revision automaticamente al cerrarse.
    run(
      `UPDATE fases_periodo
       SET abierta = 0, cerrada_at = CURRENT_TIMESTAMP
       WHERE id_periodo = ? AND fase = ?`,
      [id_periodo, fase],
    );

    if (fase === "finalizacion") {
      run(
        `UPDATE fases_periodo
         SET abierta = 1
         WHERE id_periodo = ? AND fase = 'revision'`,
        [id_periodo],
      );
    }

    return { cerrada: true, fase };
  }

  static abrirFase(id_periodo, fase) {
    if (fase === "revision") {
      throw new Error("REVISION_SE_ABRE_AUTOMATICAMENTE");
    }
    if (fase === "revision_especial") {
      throw new Error("USA_ABRIR_REVISION_ESPECIAL");
    }
    const periodo = this.getById(id_periodo);
    if (!periodo) throw new Error("PERIODO_NO_ENCONTRADO");
    if (periodo.cerrado) throw new Error("PERIODO_YA_CERRADO");

    const faseBD = this.getFase(id_periodo, fase);
    if (!faseBD) throw new Error("FASE_NO_ENCONTRADA");
    if (faseBD.abierta) throw new Error("FASE_YA_ABIERTA");

    if (fase.startsWith("pendiente_")) {
      const revision = this.getFase(id_periodo, "revision");
      const especial = this.getFase(id_periodo, "revision_especial");
      if (revision?.abierta || especial?.abierta) {
        throw new Error("DEBE_CERRAR_REVISION_PRIMERO");
      }
    }

    // Cambio: solo abre fases permitidas por el estado del periodo.
    run(
      `UPDATE fases_periodo
       SET abierta = 1, cerrada_at = NULL
       WHERE id_periodo = ? AND fase = ?`,
      [id_periodo, fase],
    );

    return { abierta: true, fase };
  }


  // Cambio: revision especial opcional, alargue de la revision antes del nuevo periodo.
  static abrirRevisionEspecial(id_periodo) {
    const periodo = get(
      `SELECT * FROM periodos_escolares
       WHERE id = ? AND activo = 1 AND cerrado = 0`,
      [id_periodo],
    );
    if (!periodo) throw new Error("PERIODO_NO_VALIDO");

    const revision = this.getFase(id_periodo, "revision");
    if (!revision?.abierta) throw new Error("FASE_REVISION_NO_ABIERTA");

    const especial = this.getFase(id_periodo, "revision_especial");
    if (!especial) throw new Error("FASE_NO_ENCONTRADA");
    if (especial.cerrada_at) throw new Error("REVISION_ESPECIAL_YA_USADA");

    const sinAprobar = get(
      `SELECT COUNT(*) AS total
       FROM estudiante_asignatura_pendiente
       WHERE id_periodo = ? AND fase = 'revision' AND aprobada = 0`,
      [id_periodo],
    );
    if (sinAprobar.total === 0) {
      throw new Error("SIN_MATERIAS_PARA_REVISION_ESPECIAL");
    }

    transaction(() => {
      run(
        `UPDATE fases_periodo
         SET abierta = 0, cerrada_at = CURRENT_TIMESTAMP
         WHERE id_periodo = ? AND fase = 'revision'`,
        [id_periodo],
      );
      run(
        `UPDATE fases_periodo
         SET abierta = 1, cerrada_at = NULL
         WHERE id_periodo = ? AND fase = 'revision_especial'`,
        [id_periodo],
      );
    })();

    return {
      abierta: true,
      fase: "revision_especial",
      materias: sinAprobar.total,
    };
  }

  static cerrarRevisionYNuevoPeriodo(id_periodo) {
    const periodo = get(
      `SELECT * FROM periodos_escolares
       WHERE id = ? AND activo = 1 AND cerrado = 0`,
      [id_periodo],
    );
    if (!periodo) throw new Error("PERIODO_NO_VALIDO");

    // Cambio: se puede cerrar desde la revision normal o desde la especial.
    const revision = this.getFase(id_periodo, "revision");
    const especial = this.getFase(id_periodo, "revision_especial");
    if (!revision?.abierta && !especial?.abierta) {
      throw new Error("FASE_REVISION_NO_ABIERTA");
    }

    const pendientesSinNota = get(
      `SELECT COUNT(*) AS total
       FROM estudiante_asignatura_pendiente
       WHERE id_periodo = ?
         AND fase = 'revision'
         AND nota_obtenida IS NULL AND inasistente = 0`,
      [id_periodo],
    );
    if (pendientesSinNota.total > 0) {
      throw new Error("HAY_NOTAS_REVISION_PENDIENTES");
    }

    // Cambio: cerrar revision y avanzar de periodo comparten la misma logica de movimiento.
    return this.avanzarSiguientePeriodo(id_periodo, { cerrarFaseRevision: true });
  }

  static avanzarSiguientePeriodo(id_periodo, { cerrarFaseRevision = false } = {}) {
    const periodo = get(
      `SELECT * FROM periodos_escolares
       WHERE id = ? AND activo = 1 AND cerrado = 0`,
      [id_periodo],
    );
    if (!periodo) throw new Error("PERIODO_NO_VALIDO");

    const nuevoNombre = this._siguienteNombrePeriodo(periodo.nombre);
    const siguienteExiste = get(
      `SELECT id FROM periodos_escolares WHERE nombre = ?`,
      [nuevoNombre],
    );
    if (siguienteExiste) throw new Error("PERIODO_SIGUIENTE_YA_EXISTE");

    const resultados = {
      periodoAnterior: { id: periodo.id, nombre: periodo.nombre },
      periodoNuevo: { id: null, nombre: nuevoNombre },
      aprobados: [],
      conPendientes: [],
      reprobados: [],
      egresados: [],
      errores: [],
    };

    // Cambio: revision cerrada (o finalizacion sin nadie para revision) genera el siguiente periodo.
    const procesarCierre = transaction(() => {
      if (cerrarFaseRevision) {
        run(
          `UPDATE fases_periodo
           SET abierta = 0, cerrada_at = CURRENT_TIMESTAMP
           WHERE id_periodo = ? AND fase IN ('revision', 'revision_especial') AND abierta = 1`,
          [id_periodo],
        );
      }

      run(
        `UPDATE periodos_escolares
         SET activo = 0, cerrado = 1
         WHERE id = ?`,
        [id_periodo],
      );

      const nuevo = run(
        `INSERT INTO periodos_escolares (nombre, activo, cerrado)
         VALUES (?, 1, 0)`,
        [nuevoNombre],
      );
      const id_nuevo_periodo = nuevo.lastInsertRowid;
      resultados.periodoNuevo.id = id_nuevo_periodo;

      this._crearFases(id_nuevo_periodo);

      const estados = all(
        `SELECT ep.id_estudiante, ep.id_grado, ep.estado, g.anio, g.seccion
         FROM estados_estudiante_periodo ep
         INNER JOIN grados g ON g.id = ep.id_grado
         WHERE ep.id_periodo = ?`,
        [id_periodo],
      );

      for (const estudiante of estados) {
        try {
          if (estudiante.estado === "aprobado") {
            this._moverAprobado(
              estudiante,
              id_periodo,
              id_nuevo_periodo,
              resultados,
            );
          }

          if (estudiante.estado === "pendiente") {
            this._moverConPendientes(
              estudiante,
              id_periodo,
              id_nuevo_periodo,
              resultados,
            );
          }

          if (estudiante.estado === "reprobado") {
            this._moverReprobado(
              estudiante,
              id_periodo,
              id_nuevo_periodo,
              resultados,
            );
          }
        } catch (error) {
          resultados.errores.push({
            id_estudiante: estudiante.id_estudiante,
            error: error.message,
          });
        }
      }

      // Cambio: pendiente_oct solo abre si alguien realmente arrastra materias.
      if (resultados.conPendientes.length > 0) {
        run(
          `UPDATE fases_periodo
           SET abierta = 1
           WHERE id_periodo = ? AND fase = 'pendiente_oct'`,
          [id_nuevo_periodo],
        );
      }
    });

    procesarCierre();
    return resultados;
  }

  static _moverAprobado(
    estudiante,
    id_periodo_anterior,
    id_nuevo_periodo,
    resultados,
  ) {
    const gradoBase = this._getGradoBaseParaCierreRevision(
      estudiante,
      id_periodo_anterior,
    );

    if (gradoBase.anio === 5) {
      run(`UPDATE estudiantes SET egresado = 1 WHERE id = ?`, [
        estudiante.id_estudiante,
      ]);
      this._desactivarRelacionAnterior(
        estudiante.id_estudiante,
        id_periodo_anterior,
      );
      resultados.egresados.push({ id_estudiante: estudiante.id_estudiante });
      return;
    }

    const gradoDestino = get(
      `SELECT id FROM grados WHERE anio = ? AND seccion = ?`,
      [gradoBase.anio + 1, gradoBase.seccion],
    );
    if (!gradoDestino) {
      throw new Error(
        `GRADO_${gradoBase.anio + 1}_${gradoBase.seccion}_NO_EXISTE`,
      );
    }
    // Cambio: si el grado destino estaba deshabilitado, se habilita automaticamente.
    run(`UPDATE grados SET activo = 1 WHERE id = ? AND activo = 0`, [
      gradoDestino.id,
    ]);

    run(
      `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, activo, id_periodo)
       VALUES (?, ?, 1, ?)`,
      [estudiante.id_estudiante, gradoDestino.id, id_nuevo_periodo],
    );
    this._desactivarRelacionAnterior(
      estudiante.id_estudiante,
      id_periodo_anterior,
    );

    resultados.aprobados.push({
      id_estudiante: estudiante.id_estudiante,
      id_grado: gradoDestino.id,
    });
  }

  static _moverConPendientes(
    estudiante,
    id_periodo_anterior,
    id_nuevo_periodo,
    resultados,
  ) {
    const gradoBase = this._getGradoBaseParaCierreRevision(
      estudiante,
      id_periodo_anterior,
    );

    // Cambio: el estudiante sigue en su seccion real; la U solo agrupa la fase de pendientes.
    const anioDestino = gradoBase.anio === 5 ? 5 : gradoBase.anio + 1;
    const gradoDestino = get(
      `SELECT id FROM grados WHERE anio = ? AND seccion = ?`,
      [anioDestino, gradoBase.seccion],
    );
    if (!gradoDestino) {
      throw new Error(`GRADO_${anioDestino}_${gradoBase.seccion}_NO_EXISTE`);
    }
        // Cambio: si el grado destino estaba deshabilitado, se habilita automaticamente.
    run(`UPDATE grados SET activo = 1 WHERE id = ? AND activo = 0`, [
      gradoDestino.id,
    ]);
    // Asegura que exista la U del año de origen para agrupar las pendientes.
    this._getOrCreateGradoU(gradoBase.anio);

    this._desactivarRelacionAnterior(
      estudiante.id_estudiante,
      id_periodo_anterior,
    );
    run(
      `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, activo, id_periodo)
       VALUES (?, ?, 1, ?)`,
      [estudiante.id_estudiante, gradoDestino.id, id_nuevo_periodo],
    );

    const materias = all(
      `SELECT id_asignatura, id_grado_origen
       FROM estudiante_asignatura_pendiente
       WHERE id_estudiante = ?
         AND id_periodo = ?
         AND fase = 'revision'
         AND aprobada = 0`,
      [estudiante.id_estudiante, id_periodo_anterior],
    );

    for (const materia of materias) {
      run(
        `INSERT OR IGNORE INTO estudiante_asignatura_pendiente
           (id_estudiante, id_asignatura, id_grado_origen, id_periodo, fase, aprobada)
         VALUES (?, ?, ?, ?, 'pendiente_oct', 0)`,
        [
          estudiante.id_estudiante,
          materia.id_asignatura,
          materia.id_grado_origen,
          id_nuevo_periodo,
        ],
      );
    }

    resultados.conPendientes.push({
      id_estudiante: estudiante.id_estudiante,
      id_grado: gradoDestino.id,
      materias: materias.length,
    });
  }

  static _moverReprobado(
    estudiante,
    id_periodo_anterior,
    id_nuevo_periodo,
    resultados,
  ) {
    const gradoBase = this._getGradoBaseParaCierreRevision(
      estudiante,
      id_periodo_anterior,
    );
    const mismoGrado = get(
      `SELECT id FROM grados WHERE anio = ? AND seccion = ?`,
      [gradoBase.anio, gradoBase.seccion],
    );
    if (!mismoGrado) {
      throw new Error(
        `GRADO_${gradoBase.anio}_${gradoBase.seccion}_NO_EXISTE`,
      );
    }
    // Cambio: si el grado estaba deshabilitado, se habilita automaticamente.
    run(`UPDATE grados SET activo = 1 WHERE id = ? AND activo = 0`, [
      mismoGrado.id,
    ]);
    this._desactivarRelacionAnterior(
      estudiante.id_estudiante,
      id_periodo_anterior,
    );
    run(
      `INSERT INTO rel_estudiante_grado (id_estudiante, id_grado, activo, id_periodo)
       VALUES (?, ?, 1, ?)`,
      [estudiante.id_estudiante, mismoGrado.id, id_nuevo_periodo],
    );

    resultados.reprobados.push({
      id_estudiante: estudiante.id_estudiante,
      id_grado: mismoGrado.id,
    });
  }

  static _desactivarRelacionAnterior(id_estudiante, id_periodo) {
    run(
      `UPDATE rel_estudiante_grado
       SET activo = 0, deleted_at = CURRENT_TIMESTAMP
       WHERE id_estudiante = ?
         AND id_periodo = ?
         AND activo = 1`,
      [id_estudiante, id_periodo],
    );
  }

  static _crearFases(id_periodo) {
    for (const fase of FASES_PERIODO) {
      run(
        `INSERT OR IGNORE INTO fases_periodo (id_periodo, fase, abierta)
         VALUES (?, ?, ?)`,
        [id_periodo, fase, fase === "finalizacion" ? 1 : 0],
      );
    }
  }

  static _getOrCreateGradoU(anio) {
    // Cambio: la seccion U nace solo cuando hay estudiantes con pendientes.
    run(`INSERT OR IGNORE INTO grados (anio, seccion) VALUES (?, 'U')`, [anio]);
    return get(`SELECT id, anio, seccion FROM grados WHERE anio = ? AND seccion = 'U'`, [
      anio,
    ]);
  }

  static _getGradoBaseParaCierreRevision(estudiante, id_periodo_anterior) {
    if (estudiante.seccion !== "U") return estudiante;

    const origen = get(
      `SELECT g.id AS id_grado, g.anio, g.seccion
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN grados g ON g.id = eap.id_grado_origen
       WHERE eap.id_estudiante = ?
         AND eap.id_periodo = ?
         AND eap.fase = 'revision'
       ORDER BY g.anio, g.seccion
       LIMIT 1`,
      [estudiante.id_estudiante, id_periodo_anterior],
    );

    // Cambio: si revision uso U, la promocion vuelve a calcularse desde el grado real de origen.
    return origen ?? estudiante;
  }

  static _siguienteNombrePeriodo(nombre) {
    const partes = nombre.split("-");
    if (partes.length !== 2) throw new Error("FORMATO_PERIODO_INVALIDO");

    const inicio = Number.parseInt(partes[0], 10);
    const fin = Number.parseInt(partes[1], 10);
    if (Number.isNaN(inicio) || Number.isNaN(fin)) {
      throw new Error("FORMATO_PERIODO_INVALIDO");
    }

    return `${inicio + 1}-${fin + 1}`;
  }
}
