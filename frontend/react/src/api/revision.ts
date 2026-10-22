import { fetchWithAuth } from "./apiClient";

const API_URL = "http://localhost:1234/revision";

export type MateriaRevision = {
  id: number;
  id_asignatura: number;
  asignatura: string;
  nota_obtenida: number | null;
  aprobada: number;
  aprobada_en_fase?: string | null;
  inasistente?: number;
};

export type EstudianteRevision = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula: number;
  anio: number;
  seccion: string;
  id_grado: number;
  estado?: string;
  materias: MateriaRevision[];
};

export type RevisionEstudiante = {
  periodo: string;
  anio: number | null;
  seccion: string | null;
  asignatura: string;
  nota_obtenida: number | null;
  aprobada: number;
  aprobada_en_fase?: string | null;
  inasistente?: number;
};

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.body?.error ?? data?.error ?? "ERROR_REVISION");
  return (data?.body ?? data) as T;
}

export async function obtenerEstudiantesRevision(idPeriodo: number) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/estudiantes`);
  return unwrap<EstudianteRevision[]>(res);
}

export async function registrarNotaRevision(idPendiente: number, nota: number | "IN") {
  // Cambio: registra nota sin mover estudiantes.
  const res = await fetchWithAuth(`${API_URL}/nota/${idPendiente}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota }),
  });
  return unwrap(res);
}

export async function obtenerEstudiantesRevisionProfesor(idPeriodo: number) {
  // Cambio: vista de profesor para revision separada de notas de lapso.
  const res = await fetchWithAuth(`${API_URL}/profesor/${idPeriodo}/estudiantes`);
  return unwrap<EstudianteRevision[]>(res);
}

export async function registrarNotaRevisionProfesor(
  idPendiente: number,
  nota: number | "IN",
) {
  const res = await fetchWithAuth(`${API_URL}/profesor/nota/${idPendiente}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nota }),
  });
  return unwrap(res);
}

export async function obtenerMisRevisiones() {
  // Cambio: estudiante consulta revision sin mezclarla con historial normal.
  const res = await fetchWithAuth(`${API_URL}/mis-revisiones`);
  return unwrap<RevisionEstudiante[]>(res);
}
