import type {
  AreaCodigo,
  PlanillaEstudiante,
  PlanillaFasePendiente,
  PlanillaReporte,
  PlanillaTotalesArea,
} from "../api/planilla";
import {
  obtenerPlanillaFinalizacion,
  obtenerPlanillaPendiente,
  obtenerPlanillaRevision,
} from "../api/planilla";

const AREAS: Array<{ codigo: AreaCodigo; nombre: string }> = [
  { codigo: "LL", nombre: "Lengua y Literatura" },
  { codigo: "ID", nombre: "Idiomas" },
  { codigo: "MA", nombre: "Matematica" },
  { codigo: "EF", nombre: "Educacion Fisica" },
  { codigo: "BAT", nombre: "Biologia, Ambiente y Tecnologia" },
  { codigo: "FI", nombre: "Fisica" },
  { codigo: "QU", nombre: "Quimica" },
  { codigo: "GHSN", nombre: "Geografia, Historia y Soberania Nacional" },
  { codigo: "ITP", nombre: "Innovacion Tecnologica y Productiva" },
  { codigo: "OV", nombre: "Orientacion Vocacional" },
];

const DEFAULT_ROWS_PER_PAGE = 35;
const DEFAULT_LOGO_URL = "/LOGO_LICEO.png";
const EMPTY_STUDENT_CELL = "***";
const TEMPLATE_URL = new URL("../../templatePeriods.html", import.meta.url).href;
const STYLES_URL = new URL("../../newstyles.css", import.meta.url).href;

export type InstitucionPlanilla = {
  codigo: string;
  denominacion: string;
  direccion: string;
  telefono: string;
  municipio: string;
  entidadFederal: string;
  cdcee: string;
  director: string;
  directorCedula: string;
  planEstudio: string;
  codigoPlan: string;
};

export type PeriodReportOptions = {
  institucion?: Partial<InstitucionPlanilla>;
  logoUrl?: string;
  mesAnio?: string;
  filasPorPagina?: number;
  autoPrint?: boolean;
};

export type PeriodReportRequest =
  | {
      tipo: "finalizacion";
      idPeriodo: number;
      idGrado: number;
      options?: PeriodReportOptions;
    }
  | {
      tipo: "revision";
      idPeriodo: number;
      idGrado: number;
      options?: PeriodReportOptions;
    }
  | {
      tipo: "pendiente";
      idPeriodo: number;
      idGrado: number;
      fase: PlanillaFasePendiente;
      options?: PeriodReportOptions;
    };

type ExportTarget = {
  win: Window;
  cleanup?: () => void;
};

const DEFAULT_INSTITUCION: InstitucionPlanilla = {
  codigo: "OD02012303",
  denominacion: "LICEO NACIONAL BOLIVARIANO GRAN MARISCAL ANTONIO JOSE DE SUCRE",
  direccion: "URB. BRISAS DEL LAGO ENTRE AV 1 Y 2 ENTRE CALLE 7 Y 8",
  telefono: "",
  municipio: "CABIMAS",
  entidadFederal: "ZULIA",
  cdcee: "ZULIA",
  director: "RODRIGUEZ LOPEZ JHOANNA ISKELL",
  directorCedula: "V 12.714.129",
  planEstudio: "CIENCIA Y TECNOLOGIA",
  codigoPlan: "31060",
};

export async function buildPeriodReportHtml(
  reporte: PlanillaReporte,
  options: PeriodReportOptions = {},
) {
  const [template, css] = await Promise.all([
    fetchText(TEMPLATE_URL),
    fetchText(STYLES_URL),
  ]);

  const fixedTemplate = normalizarMojibake(template);
  const parser = new DOMParser();
  const rowsPerPage = options.filasPorPagina ?? DEFAULT_ROWS_PER_PAGE;
  const chunks = chunk(reporte.estudiantes, rowsPerPage);
  const paginas = chunks.length > 0 ? chunks : [[]];

  const sheets = paginas.map((estudiantes, index) => {
    const doc = parser.parseFromString(fixedTemplate, "text/html");
    rellenarPlantilla(doc, reporte, estudiantes, index, rowsPerPage, options);
    const sheet = doc.querySelector(".sheet");
    return sheet?.outerHTML ?? "";
  });

  const shell = parser.parseFromString(fixedTemplate, "text/html");
  shell.head.querySelectorAll("link[rel='stylesheet']").forEach((node) => {
    node.remove();
  });
  const style = shell.createElement("style");
  style.textContent = css;
  shell.head.appendChild(style);
  shell.body.innerHTML = sheets.join("");

  return `<!DOCTYPE html>\n${shell.documentElement.outerHTML}`;
}

export async function abrirPlanillaParaImprimir(
  reporte: PlanillaReporte,
  options: PeriodReportOptions = {},
  printTarget?: ExportTarget,
) {
  const target = printTarget ?? abrirDestinoExportacion();
  const html = await buildPeriodReportHtml(reporte, options);

  // Cambio: la misma plantilla sirve para imprimir o guardar como PDF.
  escribirDocumento(target, html);

  if (options.autoPrint ?? true) {
    window.setTimeout(() => {
      target.win.focus();
      target.win.print();
      target.cleanup?.();
    }, 400);
  }
}

export async function exportarPlanillaPeriodo(request: PeriodReportRequest) {
  // Cambio: centraliza el export para finalizacion, revision y materia pendiente.
  const printTarget = abrirDestinoExportacion();
  escribirDocumento(printTarget, buildExportLoadingHtml());

  try {
    const reporte = await obtenerReportePorTipo(request);
    await abrirPlanillaParaImprimir(reporte, request.options, printTarget);
  } catch (error) {
    escribirDocumento(printTarget, buildExportErrorHtml(error));
    throw error;
  }
}

export function getMensajeErrorExportacion(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === "VENTANA_EXPORTACION_BLOQUEADA") {
    return "El navegador bloqueo la ventana de exportacion y no se pudo usar el respaldo de impresion.";
  }
  if (message === "DESTINO_EXPORTACION_NO_DISPONIBLE") {
    return "No se pudo preparar la exportacion para imprimir. Revisa permisos del navegador e intenta otra vez.";
  }
  if (message.startsWith("NO_SE_PUDO_CARGAR_PLANTILLA")) {
    return "No se pudo cargar la plantilla oficial de exportacion.";
  }
  if (message === "GRADO_NO_ENCONTRADO") {
    return "No se encontro el grado seleccionado para exportar.";
  }
  if (message === "PERIODO_NO_ENCONTRADO") {
    return "No se encontro el periodo seleccionado para exportar.";
  }

  return message || "No se pudo generar la exportacion.";
}

function abrirDestinoExportacion(): ExportTarget {
  const printWindow = window.open("", "_blank");
  if (printWindow) return { win: printWindow };

  const iframe = document.createElement("iframe");
  iframe.title = "Exportacion de planilla";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const fallbackWindow = iframe.contentWindow;
  if (!fallbackWindow) {
    iframe.remove();
    throw new Error("DESTINO_EXPORTACION_NO_DISPONIBLE");
  }

  // Cambio: si el popup se bloquea, imprime desde un iframe sin perder el reporte.
  return {
    win: fallbackWindow,
    cleanup: () => window.setTimeout(() => iframe.remove(), 60000),
  };
}

function escribirDocumento(target: ExportTarget, html: string) {
  target.win.document.open();
  target.win.document.write(html);
  target.win.document.close();
}

function buildExportLoadingHtml() {
  return `<!doctype html>
<html>
  <head><title>Generando reporte</title></head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    Generando reporte...
  </body>
</html>`;
}

function buildExportErrorHtml(error: unknown) {
  const message = escapeHtml(getMensajeErrorExportacion(error));
  return `<!doctype html>
<html>
  <head><title>Error de exportacion</title></head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <h1>No se pudo generar el reporte</h1>
    <p>${message}</p>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function obtenerReportePorTipo(request: PeriodReportRequest) {
  if (request.tipo === "finalizacion") {
    return obtenerPlanillaFinalizacion(request.idPeriodo, request.idGrado);
  }

  if (request.tipo === "revision") {
    return obtenerPlanillaRevision(request.idPeriodo, request.idGrado);
  }

  return obtenerPlanillaPendiente(request.idPeriodo, request.idGrado, request.fase);
}

function rellenarPlantilla(
  doc: Document,
  reporte: PlanillaReporte,
  estudiantes: PlanillaEstudiante[],
  pageIndex: number,
  rowsPerPage: number,
  options: PeriodReportOptions,
) {
  const institucion = { ...DEFAULT_INSTITUCION, ...options.institucion };
  const totalEstudiantes = reporte.estudiantes.length;

  setImage(doc, ".flag-box img", options.logoUrl ?? DEFAULT_LOGO_URL);
  setHeader(doc, reporte, options);
  setInstitucion(doc, institucion);
  setEstudiantes(doc, estudiantes, rowsPerPage);
  setTotales(doc, reporte.totales);
  setProfesores(doc, reporte);
  setCurso(doc, reporte, institucion, totalEstudiantes, estudiantes.length);
  setFooter(doc, institucion);

  doc.querySelector(".sheet")?.setAttribute("data-page", String(pageIndex + 1));
}

function setHeader(
  doc: Document,
  reporte: PlanillaReporte,
  options: PeriodReportOptions,
) {
  // Cambio: llena solo los campos dinámicos marcados en el template.
  setText(doc.querySelector("[data-field='periodo']"), reporte.periodo.nombre);
  setText(doc.querySelector("[data-field='tipo-evaluacion']"), reporte.tipo);
  setText(doc.querySelector("[data-field='mes-anio']"), options.mesAnio ?? inferirMesAnio(reporte));
}

function setInstitucion(doc: Document, institucion: InstitucionPlanilla) {
  const rows = doc.querySelectorAll(".inst-grid .row");
  setText(rows[0]?.querySelectorAll(".val")[0], institucion.codigo);
  setText(rows[0]?.querySelectorAll(".val")[1], institucion.denominacion);
  setText(rows[1]?.querySelectorAll(".val")[0], institucion.direccion);
  setText(rows[1]?.querySelectorAll(".val")[1], institucion.telefono);
  setText(rows[2]?.querySelectorAll(".val")[0], institucion.municipio);
  setText(rows[2]?.querySelectorAll(".val")[1], institucion.entidadFederal);
  setText(rows[2]?.querySelectorAll(".val")[2], institucion.cdcee);
  setText(rows[3]?.querySelectorAll(".val")[0], institucion.director);
  setText(rows[3]?.querySelectorAll(".val")[1], institucion.directorCedula);
}

function setEstudiantes(
  doc: Document,
  estudiantes: PlanillaEstudiante[],
  rowsPerPage: number,
) {
  const tbody = doc.querySelector(".students tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  for (let index = 0; index < rowsPerPage; index += 1) {
    const estudiante = estudiantes[index];
    const fecha = parseFecha(estudiante);
    const row = doc.createElement("tr");
    const base = [
      String(index + 1).padStart(2, "0"),
      estudiante?.cedula,
      estudiante?.apellido,
      estudiante?.nombre,
      estudiante?.lugarNacimiento ?? estudiante?.lugar_nacimiento,
      estudiante?.ef ?? estudiante?.entidad_federal,
      estudiante?.sexo,
      fecha.dia,
      fecha.mes,
      fecha.anio,
    ];

    for (const value of base) {
      appendCell(doc, row, studentCell(value));
    }

    for (const area of AREAS) {
      appendCell(doc, row, studentCell(estudiante?.marcas?.[area.codigo]));
    }

    tbody.appendChild(row);
  }
}

function setTotales(
  doc: Document,
  totales: PlanillaReporte["totales"],
) {
  const tfoot = doc.querySelector(".students tfoot");
  if (!tfoot) return;

  const rows: Array<{ label: string; key: keyof PlanillaTotalesArea }> = [
    { label: "Inscritos", key: "inscritos" },
    { label: "Inasistentes", key: "inasistentes" },
    { label: "Aprobados", key: "aprobados" },
    { label: "No Aprobados", key: "noAprobados" },
    { label: "No Cursantes", key: "noCursantes" },
  ];

  tfoot.innerHTML = "";

  rows.forEach((row, index) => {
    const tr = doc.createElement("tr");

    if (index === 0) {
      const label = doc.createElement("td");
      label.className = "total-label";
      label.colSpan = 3;
      label.rowSpan = 5;
      label.innerHTML = "Total de Areas<br>de Formacion";
      tr.appendChild(label);
    }

    const stat = doc.createElement("td");
    stat.className = "stat-label";
    stat.colSpan = 7;
    stat.textContent = row.label;
    tr.appendChild(stat);

    for (const area of AREAS) {
      appendCell(doc, tr, formatCount(totales?.[area.codigo]?.[row.key]));
    }

    tfoot.appendChild(tr);
  });
}

function setProfesores(doc: Document, reporte: PlanillaReporte) {
  const tbody = doc.querySelector(".profesores tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  AREAS.forEach((area, index) => {
    const profesoresArea = reporte.profesores.find((p) => p.area === area.codigo);
    const profesor = profesoresArea?.profesores?.[0];
    const tr = doc.createElement("tr");

    appendCell(doc, tr, String(index + 1).padStart(2, "0"));
    appendCell(doc, tr, area.codigo, "p-abrev");
    appendCell(doc, tr, profesoresArea?.asignatura ?? area.nombre, "p-area");
    appendCell(
      doc,
      tr,
      profesor ? `${profesor.apellido} ${profesor.nombre}`.trim() : "",
      "p-name",
    );
    appendCell(doc, tr, profesor?.cedula ?? "");
    appendCell(doc, tr, "");
    tbody.appendChild(tr);
  });
}

function setCurso(
  doc: Document,
  reporte: PlanillaReporte,
  institucion: InstitucionPlanilla,
  totalEstudiantes: number,
  estudiantesPagina: number,
) {
  const cells = doc.querySelectorAll(".curso-bloque .curso-cell");
  setText(cells[0], institucion.planEstudio);
  setText(cells[1], institucion.codigoPlan);
  setText(cells[2], reporte.anioGrado);
  setText(cells[3], reporte.seccion);

  const split = cells[4]?.querySelectorAll(".curso-split div");
  setText(split?.[0], totalEstudiantes);
  setText(split?.[1], estudiantesPagina);
}

function setFooter(_doc: Document, _institucion: InstitucionPlanilla) {
  // Cambio: remisión, recepción, firmas y observaciones quedan en blanco.
}

function inferirMesAnio(reporte: PlanillaReporte) {
  const fin = reporte.periodo.nombre.split("-")[1] ?? "";
  const tipo = normalizar(reporte.tipo);

  if (tipo.includes("PENDIENTE") && tipo.includes("OCTUBRE")) return `OCTUBRE ${fin}`;
  if (tipo.includes("PENDIENTE") && tipo.includes("DICIEMBRE")) return `DICIEMBRE ${fin}`;
  if (tipo.includes("PENDIENTE") && tipo.includes("ENERO")) return `ENERO ${fin}`;
  if (tipo.includes("PENDIENTE") && tipo.includes("JUNIO")) return `JUNIO ${fin}`;
  if (tipo.includes("REVISION")) return `AGOSTO ${fin}`;
  return `JULIO ${fin}`;
}

function parseFecha(estudiante?: PlanillaEstudiante) {
  const value = estudiante?.fechaNacimiento ?? estudiante?.fecha_nacimiento;
  if (!value) return { dia: "", mes: "", anio: "" };

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { dia: "", mes: "", anio: "" };

  return {
    dia: String(date.getUTCDate()).padStart(2, "0"),
    mes: String(date.getUTCMonth() + 1).padStart(2, "0"),
    anio: String(date.getUTCFullYear()),
  };
}

function setImage(doc: Document, selector: string, src: string) {
  const image = doc.querySelector<HTMLImageElement>(selector);
  if (image) image.src = src;
}

function setText(target: Element | undefined | null, value: unknown) {
  if (target) target.textContent = value === null || value === undefined ? "" : String(value);
}

function appendCell(
  doc: Document,
  row: HTMLTableRowElement,
  value: unknown,
  className = "",
) {
  const cell = doc.createElement("td");
  if (className) cell.className = className;
  cell.textContent = value === null || value === undefined ? "" : String(value);
  row.appendChild(cell);
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

function formatCount(value: number | undefined) {
  return String(value ?? 0).padStart(2, "0");
}

function studentCell(value: unknown) {
  // Cambio: las celdas vacias de filas estudiantiles se imprimen con ***.
  if (value === null || value === undefined || value === "") return EMPTY_STUDENT_CELL;
  return value;
}

async function fetchText(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NO_SE_PUDO_CARGAR_PLANTILLA_${res.status}`);
  return res.text();
}

function normalizar(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function normalizarMojibake(template: string) {
  // Cambio: primero intenta reparar mojibake de forma generica en la plantilla.
  template = corregirMojibakeGenerico(template);

  const replacements: Record<string, string> = {
    "CÃ³digo": "Codigo",
    "AÃ±o": "Año",
    "EvaluaciÃ³n": "Evaluacion",
    "InstituciÃ³n": "Institucion",
    "Educativa": "Educativa",
    "DenominaciÃ³n": "Denominacion",
    "EpÃ³nimo": "Eponimo",
    "DirecciÃ³n": "Direccion",
    "TelÃ©fono": "Telefono",
    "Municipio": "Municipio",
    "Entidad Federal": "Entidad Federal",
    "CÃ©dula": "Cedula",
    "IdentificaciÃ³n": "Identificacion",
    "NÂº": "Nº",
    "FORMACIÃ“N": "FORMACION",
    "CIENTÃFICA": "CIENTIFICA",
    "TECNOLÃ“GICA": "TECNOLOGICA",
    "ÃREAS": "AREAS",
    "Ãrea": "Area",
    "Ãreas": "Areas",
    "AÃ‘O": "AÑO",
    "PÃGINA": "PAGINA",
    "SECCIÃ“N": "SECCION",
    "CÃ“DIGO": "CODIGO",
    "CIENCIA Y TECNOLOGÃA": "CIENCIA Y TECNOLOGIA",
    "MatemÃ¡tica": "Matematica",
    "EducaciÃ³n FÃ­sica": "Educacion Fisica",
    "BiologÃ­a": "Biologia",
    "FÃ­sica": "Fisica",
    "QuÃ­mica": "Quimica",
    "GeografÃ­a": "Geografia",
    "SoberanÃ­a": "Soberania",
    "InnovaciÃ³n": "Innovacion",
    "TecnolÃ³gica": "Tecnologica",
    "OrientaciÃ³n": "Orientacion",
    "Vocacional": "Vocacional",
    "RemisiÃ³n": "Remision",
    "RecepciÃ³n": "Recepcion",
    "InstituciÃ“N": "Institucion",
  };

  return Object.entries(replacements).reduce(
    (current, [from, to]) => current.replaceAll(from, to),
    template,
  );
}

function corregirMojibakeGenerico(value: string) {
  let current = value;

  for (let index = 0; index < 2; index += 1) {
    const decoded = decodeLatin1AsUtf8(current);
    if (badEncodingScore(decoded) >= badEncodingScore(current)) break;
    current = decoded;
  }

  return current;
}

function decodeLatin1AsUtf8(value: string) {
  const bytes = Uint8Array.from(Array.from(value), (char) => char.charCodeAt(0) & 0xff);
  return new TextDecoder("utf-8").decode(bytes);
}

function badEncodingScore(value: string) {
  return (value.match(/[\u00c3\u00c2\ufffd]/g) ?? []).length;
}
