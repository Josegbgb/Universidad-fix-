import { fetchWithAuth } from "./apiClient";
import type { PlanillaFasePendiente } from "./planilla";

const API_URL = "http://localhost:1234/pendientes";

export type MateriaPendiente = {
  id: number;
  id_asignatura: number;
  asignatura: string;
  nota_obtenida: number | null;
  aprobada: number;
  aprobada_en_fase?: string | null;
  inasistente?: number;
};

export type EstudiantePendiente = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula: number;
  anio: number;
  seccion: string;
  id_grado: number;
  estado?: string;
  materias: MateriaPendiente[];
};

export type PendienteEstudiante = {
  periodo: string;
  anio: number | null;
  seccion: string | null;
  fase: PlanillaFasePendiente;
  asignatura: string;
  nota_obtenida: number | null;
  aprobada: number;
  aprobada_en_fase?: string | null;
  inasistente?: number;
};

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.body?.error ?? data?.error ?? "ERROR_PENDIENTE");
  return (data?.body ?? data) as T;
}

export async function obtenerEstudiantesPendientes(
  idPeriodo: number,
  fase: PlanillaFasePendiente,
) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/${fase}/estudiantes`);
  return unwrap<EstudiantePendiente[]>(res);
}

export async function registrarNotaPendiente(
  idPendiente: number,
  nota: number | "IN",
  fase: PlanillaFasePendiente,
) {
  // Cambio: registra notas por momento de materia pendiente.
  const res = await fetchWithAuth(`${API_URL}/nota/${idPendiente}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota, fase }),
  });
  return unwrap(res);
}

export async function cerrarFasePendiente(
  idPeriodo: number,
  fase: PlanillaFasePendiente,
) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/${fase}/cerrar`, {
    method: "POST",
  });
  return unwrap(res);
}

export async function obtenerEstudiantesPendientesProfesor(
  idPeriodo: number,
  fase: PlanillaFasePendiente,
) {
  // Cambio: vista de profesor para pendientes separada de revision/lapso.
  const res = await fetchWithAuth(
    `${API_URL}/profesor/${idPeriodo}/${fase}/estudiantes`,
  );
  return unwrap<EstudiantePendiente[]>(res);
}

export async function registrarNotaPendienteProfesor(
  idPendiente: number,
  nota: number | "IN",
  fase: PlanillaFasePendiente,
) {
  const res = await fetchWithAuth(`${API_URL}/profesor/nota/${idPendiente}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota, fase }),
  });
  return unwrap(res);
}

export async function obtenerMisPendientes() {
  // Cambio: estudiante consulta pendientes sin mezclar con notas normales.
  const res = await fetchWithAuth(`${API_URL}/mis-pendientes`);
  return unwrap<PendienteEstudiante[]>(res);
}
