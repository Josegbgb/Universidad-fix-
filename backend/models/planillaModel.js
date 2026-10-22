import { all, get } from "../src/db.js";

const NOTA_MINIMA = 10;
const MARCA_APROBADA = "\u2713";

const AREAS = [
  { codigo: "LL", clave: "lengua y literatura" },
  { codigo: "ID", clave: "idiomas" },
  { codigo: "MA", clave: "matematica" },
  { codigo: "EF", clave: "educacion fisica" },
  { codigo: "BAT", clave: "biologia ambiente y tecnologia" },
  { codigo: "FI", clave: "fisica" },
  { codigo: "QU", clave: "quimica" },
  { codigo: "GHSN", clave: "geografia historia y soberania nacional" },
  { codigo: "ITP", clave: "innovacion tecnologica y productiva" },
  { codigo: "OV", clave: "orientacion vocacional" },
];

const TIPO_PENDIENTE = {
  pendiente_oct: "MATERIA PENDIENTE - OCTUBRE",
  pendiente_dic: "MATERIA PENDIENTE - DICIEMBRE",
  pendiente_ene: "MATERIA PENDIENTE - ENERO",
  pendiente_jun: "MATERIA PENDIENTE - JUNIO",
};

export class PlanillaModel {
  static getFinalizacion(id_periodo, id_grado) {
    const base = this._getBasePlanilla(id_periodo, id_grado);
    // Cambio: cada planilla expone nacimiento y EF del estudiante.
    // Cambio: los historicos usan la relacion del periodo aunque ya este cerrada.
    const rows = all(
      `SELECT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         e.lugar_nacimiento,
         e.entidad_federal AS ef,
         reg.id AS id_rel_estudiante_grado
       FROM rel_estudiante_grado reg
       INNER JOIN estudiantes e ON e.id = reg.id_estudiante
       INNER JOIN grados g ON g.id = reg.id_grado
       WHERE reg.id_periodo = ?
         AND reg.id_grado = ?
         AND e.deleted_at IS NULL
         AND g.seccion <> 'U'
       ORDER BY e.apellido, e.nombre`,
      [id_periodo, id_grado],
    );

    const totales = this._inicializarTotales();
    const estudiantes = rows.map((estudiante) => {
      // Cambio: finalizacion usa promedios de los tres lapsos.
      const marcas = this._marcasFinalizacion(
        estudiante,
        id_periodo,
        base.asignaturasPorArea,
      );
      this._sumarTotales(totales, marcas);
      return { ...estudiante, marcas };
    });

    return this._armarRespuesta("FINAL", base, estudiantes, totales);
  }

  static getRevision(id_periodo, id_grado) {
    const base = this._getBasePlanilla(id_periodo, id_grado);
    // Cambio: revision historica sale de las materias enviadas a revision.
    const rows = all(
      `SELECT DISTINCT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         e.lugar_nacimiento,
         e.entidad_federal AS ef
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN estudiantes e ON e.id = eap.id_estudiante
       INNER JOIN grados g ON g.id = eap.id_grado_origen
       WHERE eap.id_periodo = ?
          AND (
            (? = 'U' AND g.anio = ?)
            OR (? <> 'U' AND eap.id_grado_origen = ?)
          )
          AND eap.fase = 'revision'
          AND e.deleted_at IS NULL
       ORDER BY e.apellido, e.nombre`,
      [
        id_periodo,
        base.grado.seccion,
        base.grado.anio,
        base.grado.seccion,
        id_grado,
      ],
    );

    const totales = this._inicializarTotales();
    const estudiantes = rows.map((estudiante) => {
      // Cambio: en revision las materias que no fueron a revision quedan aprobadas.
      const marcas = this._marcasRevision(
        estudiante.id_estudiante,
        id_periodo,
        base.asignaturasPorArea,
      );
      this._sumarTotales(totales, marcas);
      return { ...estudiante, marcas };
    });

    return this._armarRespuesta(
      "REVISI\u00d3N",
      base,
      estudiantes,
      totales,
    );
  }

  static getPendiente(id_periodo, id_grado, fase) {
    if (!TIPO_PENDIENTE[fase]) throw new Error("FASE_INVALIDA");

    const base = this._getBasePlanilla(id_periodo, id_grado);
    // Cambio: la exportacion muestra tambien materias ya evaluadas en la fase.
    const rows = all(
      `SELECT DISTINCT
         e.id AS id_estudiante,
         e.nombre,
         e.apellido,
         e.cedula,
         e.lugar_nacimiento,
         e.entidad_federal AS ef
       FROM estudiante_asignatura_pendiente eap
       INNER JOIN estudiantes e ON e.id = eap.id_estudiante
       INNER JOIN grados go ON go.id = eap.id_grado_origen
       WHERE eap.id_periodo = ?
          AND (
            (? = 'U' AND go.anio = ?)
          OR (? <> 'U' AND eap.id_grado_origen = ?)
          )
          AND eap.fase = ?
          AND e.deleted_at IS NULL
       ORDER BY e.apellido, e.nombre`,
      [
        id_periodo,
        base.grado.seccion,
        base.grado.anio,
        base.grado.seccion,
        id_grado,
        fase,
      ],
    );

    const totales = this._inicializarTotales();
    const estudiantes = rows.map((estudiante) => {
      // Cambio: pendientes solo marca las materias activas en la fase.
      const marcas = this._marcasPendiente(
        estudiante.id_estudiante,
        id_periodo,
        base.grado.seccion === "U" ? null : id_grado,
        fase,
        base.asignaturasPorArea,
      );
      this._sumarTotales(totales, marcas);
      return { ...estudiante, marcas };
    });

    return this._armarRespuesta(
      TIPO_PENDIENTE[fase],
      base,
      estudiantes,
      totales,
    );
  }

  static _getBasePlanilla(id_periodo, id_grado) {
    const periodo = get(`SELECT * FROM periodos_escolares WHERE id = ?`, [
      id_periodo,
    ]);
    if (!periodo) throw new Error("PERIODO_NO_ENCONTRADO");

    const grado = get(`SELECT * FROM grados WHERE id = ?`, [id_grado]);
    if (!grado) throw new Error("GRADO_NO_ENCONTRADO");

    let idGradoAsignaturas = id_grado;
    let asignaturas = all(
      `SELECT
         rga.id AS id_rel_grado_asignatura,
         a.id AS id_asignatura,
         a.nombre
       FROM rel_grado_asignatura rga
       INNER JOIN asignaturas a ON a.id = rga.id_asignatura
       WHERE rga.id_grado = ?
          AND rga.deleted_at IS NULL`,
      [idGradoAsignaturas],
    );

    if (grado.seccion === "U" && asignaturas.length === 0) {
      // Cambio: las secciones U usan el pensum de una seccion real del mismo anio.
      const gradoPensum = get(
        `SELECT g.id
         FROM grados g
         WHERE g.anio = ? AND g.seccion <> 'U'
           AND EXISTS (
             SELECT 1 FROM rel_grado_asignatura rga
             WHERE rga.id_grado = g.id AND rga.deleted_at IS NULL
           )
         ORDER BY g.seccion LIMIT 1`,
        [grado.anio],
      );

      if (gradoPensum) {
        idGradoAsignaturas = gradoPensum.id;
        asignaturas = all(
          `SELECT
             rga.id AS id_rel_grado_asignatura,
             a.id AS id_asignatura,
             a.nombre
           FROM rel_grado_asignatura rga
           INNER JOIN asignaturas a ON a.id = rga.id_asignatura
           WHERE rga.id_grado = ?
             AND rga.deleted_at IS NULL`,
          [idGradoAsignaturas],
        );
      }
    }

    const asignaturasPorArea = this._organizarAsignaturas(asignaturas);
    const profesores = this._getProfesoresPorArea(
      idGradoAsignaturas,
      asignaturasPorArea,
    );

    return { periodo, grado, asignaturasPorArea, profesores };
  }

  static _marcasFinalizacion(estudiante, id_periodo, asignaturasPorArea) {
    const marcas = {};
    // Cambio: repitentes solo cursan materias reprobadas; las demas son NC.
    const materiasRepetidas = this._getMateriasRepetidas(
      estudiante.id_estudiante,
      id_periodo,
    );

    for (const area of AREAS) {
      const asignatura = asignaturasPorArea[area.codigo];
      if (!asignatura) {
        marcas[area.codigo] = "";
        continue;
      }

      if (materiasRepetidas && !materiasRepetidas.has(asignatura.id_asignatura)) {
        marcas[area.codigo] = "NC";
        continue;
      }

      const definitiva = this._getDefinitiva(
        estudiante.id_rel_estudiante_grado,
        asignatura.id_rel_grado_asignatura,
        id_periodo,
      );
      marcas[area.codigo] = this._marcaDesdeDefinitiva(definitiva);
    }

    return marcas;
  }

  static _marcasRevision(id_estudiante, id_periodo, asignaturasPorArea) {
    const pendientes = this._getPendientesPorAsignatura(
      id_estudiante,
      id_periodo,
      "revision",
    );
    const marcas = {};

    for (const area of AREAS) {
      const asignatura = asignaturasPorArea[area.codigo];
      if (!asignatura) {
        marcas[area.codigo] = "";
        continue;
      }

      const pendiente = pendientes[asignatura.id_asignatura];
      marcas[area.codigo] = pendiente
        ? this._marcaDesdePendiente(pendiente)
        : MARCA_APROBADA;
    }

    return marcas;
  }

  static _marcasPendiente(
    id_estudiante,
    id_periodo,
    id_grado,
    fase,
    asignaturasPorArea,
  ) {
    const pendientes = this._getPendientesPorAsignatura(
      id_estudiante,
      id_periodo,
      fase,
      id_grado,
    );
    const marcas = {};

    for (const area of AREAS) {
      const asignatura = asignaturasPorArea[area.codigo];
      const pendiente = asignatura
        ? pendientes[asignatura.id_asignatura]
        : null;
      marcas[area.codigo] = pendiente
        ? this._marcaDesdePendiente(pendiente)
        : "";
    }

    return marcas;
  }

  static _getDefinitiva(
    id_rel_estudiante_grado,
    id_rel_grado_asignatura,
    id_periodo,
  ) {
    return get(
      `SELECT
         AVG(COALESCE(n.nota, 0)) AS definitiva,
         SUM(CASE WHEN n.nota IS NOT NULL THEN 1 ELSE 0 END) AS lapsos_con_nota
       FROM lapsos l
       LEFT JOIN notas n ON n.id_lapso = l.id
         AND n.id_rel_estudiante_grado = ?
         AND n.id_rel_grado_asignatura = ?
         AND n.id_periodo = ?`,
      [id_rel_estudiante_grado, id_rel_grado_asignatura, id_periodo],
    );
  }

  static _getMateriasRepetidas(id_estudiante, id_periodo) {
    const periodo = get(`SELECT nombre FROM periodos_escolares WHERE id = ?`, [
      id_periodo,
    ]);
    if (!periodo) return null;

    const periodoAnterior = get(
      `SELECT id FROM periodos_escolares WHERE nombre = ?`,
      [this._nombrePeriodoAnterior(periodo.nombre)],
    );
    if (!periodoAnterior) return null;

    const estadoAnterior = get(
      `SELECT estado FROM estados_estudiante_periodo
       WHERE id_estudiante = ? AND id_periodo = ?`,
      [id_estudiante, periodoAnterior.id],
    );
    if (estadoAnterior?.estado !== "reprobado") return null;

    const materias = all(
      `SELECT id_asignatura
       FROM estudiante_asignatura_pendiente
       WHERE id_estudiante = ?
         AND id_periodo = ?
         AND fase = 'revision'
         AND aprobada = 0`,
      [id_estudiante, periodoAnterior.id],
    );

    return new Set(materias.map((materia) => materia.id_asignatura));
  }

  static _nombrePeriodoAnterior(nombre) {
    const partes = String(nombre).split("-");
    if (partes.length !== 2) return "";

    const inicio = Number.parseInt(partes[0], 10);
    const fin = Number.parseInt(partes[1], 10);
    if (Number.isNaN(inicio) || Number.isNaN(fin)) return "";

    return `${inicio - 1}-${fin - 1}`;
  }

  static _getPendientesPorAsignatura(
    id_estudiante,
    id_periodo,
    fase,
    id_grado_origen = null,
  ) {
    const params = [id_estudiante, id_periodo, fase];
    const filtroGrado = id_grado_origen ? `AND id_grado_origen = ?` : "";
    if (id_grado_origen) params.push(id_grado_origen);

    const rows = all(
      `SELECT id_asignatura, nota_obtenida, aprobada, inasistente
       FROM estudiante_asignatura_pendiente
       WHERE id_estudiante = ?
         AND id_periodo = ?
         AND fase = ?
         ${filtroGrado}`,
      params,
    );

    return rows.reduce((acc, row) => {
      acc[row.id_asignatura] = row;
      return acc;
    }, {});
  }

  static _getProfesoresPorArea(id_grado, asignaturasPorArea) {
    const rows = all(
      `SELECT
         rga.id AS id_rel_grado_asignatura,
         a.id AS id_asignatura,
         a.nombre AS asignatura,
         p.id AS id_profesor,
         p.cedula,
         p.nombre,
         p.apellido
       FROM rel_grado_asignatura rga
       INNER JOIN asignaturas a ON a.id = rga.id_asignatura
       LEFT JOIN rel_asignatura_profesor rap
         ON rap.id_rel_grado_asignatura = rga.id
         AND rap.deleted_at IS NULL
       LEFT JOIN profesores p
         ON p.id = rap.id_profesor
         AND p.deleted_at IS NULL
       WHERE rga.id_grado = ?
         AND rga.deleted_at IS NULL
       ORDER BY a.nombre, p.apellido, p.nombre`,
      [id_grado],
    );

    const porArea = AREAS.reduce((acc, area) => {
      const asignatura = asignaturasPorArea[area.codigo];
      acc[area.codigo] = {
        area: area.codigo,
        asignatura: asignatura?.nombre ?? null,
        profesores: [],
      };
      return acc;
    }, {});

    for (const row of rows) {
      const area = this._areaPorNombre(row.asignatura);
      if (!area || !row.id_profesor) continue;

      porArea[area].profesores.push({
        id_profesor: row.id_profesor,
        // Cambio: la plantilla oficial necesita cedula del profesor.
        cedula: row.cedula,
        nombre: row.nombre,
        apellido: row.apellido,
      });
    }

    return AREAS.map((area) => porArea[area.codigo]);
  }

  static _organizarAsignaturas(asignaturas) {
    const porArea = AREAS.reduce((acc, area) => {
      acc[area.codigo] = null;
      return acc;
    }, {});

    for (const asignatura of asignaturas) {
      const area = this._areaPorNombre(asignatura.nombre);
      if (area && !porArea[area]) {
        porArea[area] = asignatura;
      }
    }

    return porArea;
  }

  static _areaPorNombre(nombre) {
    const normalizado = this._normalizarNombre(nombre);
    const area = AREAS.find((item) => item.clave === normalizado);
    return area?.codigo ?? null;
  }

  static _normalizarNombre(nombre) {
    return String(nombre ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  static _marcaDesdeDefinitiva(definitiva) {
    if (!definitiva || definitiva.lapsos_con_nota === 0) return "I";
    return definitiva.definitiva >= NOTA_MINIMA ? MARCA_APROBADA : "X";
  }

  static _marcaDesdePendiente(pendiente) {
    if (pendiente.inasistente) return "I";
    
    if (pendiente.nota_obtenida === null || pendiente.nota_obtenida === undefined) {
      return "I";
    }
    return pendiente.aprobada || pendiente.nota_obtenida >= NOTA_MINIMA
      ? MARCA_APROBADA
      : "X";
  }

  static _inicializarTotales() {
    return AREAS.reduce((acc, area) => {
      acc[area.codigo] = {
        inscritos: 0,
        inasistentes: 0,
        aprobados: 0,
        noAprobados: 0,
        noCursantes: 0,
      };
      return acc;
    }, {});
  }

  static _sumarTotales(totales, marcas) {
    for (const area of AREAS) {
      const marca = marcas[area.codigo];

      if (marca === "" || marca === "NC") {
        totales[area.codigo].noCursantes += 1;
        continue;
      }

      totales[area.codigo].inscritos += 1;
      if (marca === "I") totales[area.codigo].inasistentes += 1;
      if (marca === MARCA_APROBADA) totales[area.codigo].aprobados += 1;
      if (marca === "X") totales[area.codigo].noAprobados += 1;
    }
  }

  static _armarRespuesta(tipo, base, estudiantes, totales) {
    return {
      tipo,
      periodo: base.periodo,
      anioGrado: base.grado.anio,
      seccion: base.grado.seccion,
      estudiantes,
      totales,
      profesores: base.profesores,
    };
  }
}
