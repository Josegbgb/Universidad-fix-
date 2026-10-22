import { fetchWithAuth } from "./apiClient";

const API_URL = "http://localhost:1234/planilla";

export type PlanillaFasePendiente =
  | "pendiente_oct"
  | "pendiente_dic"
  | "pendiente_ene"
  | "pendiente_jun";

export type AreaCodigo =
  | "LL"
  | "ID"
  | "MA"
  | "EF"
  | "BAT"
  | "FI"
  | "QU"
  | "GHSN"
  | "ITP"
  | "OV";

export type PlanillaTotalesArea = {
  inscritos: number;
  inasistentes: number;
  aprobados: number;
  noAprobados: number;
  noCursantes: number;
};

export type PlanillaProfesor = {
  area: AreaCodigo;
  asignatura: string | null;
  profesores: Array<{
    id_profesor: number;
    nombre: string;
    apellido: string;
    cedula?: string | number | null;
  }>;
};

export type PlanillaEstudiante = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula?: string | number | null;
  lugarNacimiento?: string | null;
  lugar_nacimiento?: string | null;
  ef?: string | null;
  // Cambio: EF tambien puede llegar con su nombre completo desde CRUD.
  entidad_federal?: string | null;
  sexo?: string | null;
  fechaNacimiento?: string | null;
  fecha_nacimiento?: string | null;
  marcas: Partial<Record<AreaCodigo, string>>;
};

export type PlanillaReporte = {
  tipo: string;
  periodo: {
    id: number;
    nombre: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
  };
  anioGrado: number;
  seccion: string;
  estudiantes: PlanillaEstudiante[];
  totales: Record<AreaCodigo, PlanillaTotalesArea>;
  profesores: PlanillaProfesor[];
};

async function obtenerPlanilla(url: string): Promise<PlanillaReporte> {
  const res = await fetchWithAuth(url);
  const data = await res.json();

  if (!res.ok) {
    // Cambio: muestra mensajes especificos del backend cuando la planilla no puede generarse.
    throw new Error(
      data?.body?.mensaje ??
        data?.body?.error ??
        data?.error ??
        data?.message ??
        "ERROR_PLANILLA",
    );
  }

  // Cambio: los endpoints del backend envuelven el payload en jsonResponse.
  return (data?.body ?? data) as PlanillaReporte;
}

export function obtenerPlanillaFinalizacion(
  idPeriodo: number,
  idGrado: number,
) {
  return obtenerPlanilla(`${API_URL}/finalizacion/${idPeriodo}/${idGrado}`);
}

export function obtenerPlanillaRevision(idPeriodo: number, idGrado: number) {
  return obtenerPlanilla(`${API_URL}/revision/${idPeriodo}/${idGrado}`);
}

export function obtenerPlanillaPendiente(
  idPeriodo: number,
  idGrado: number,
  fase: PlanillaFasePendiente,
) {
  return obtenerPlanilla(`${API_URL}/pendiente/${idPeriodo}/${idGrado}/${fase}`);
}
