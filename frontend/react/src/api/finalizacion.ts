import { fetchWithAuth } from "./apiClient";

const API_URL = "http://localhost:1234/finalizacion";

export type EstudianteFinalizacion = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula: number;
  anio: number;
  seccion: string;
  id_grado: number;
  id_rel_estudiante_grado: number;
  // Cambio: la tabla administrativa solo muestra el estado resumido.
  estado?: string;
};

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.body?.error ?? data?.error ?? "ERROR_FINALIZACION");
  }
  return (data?.body ?? data) as T;
}

export async function obtenerEstudiantesFinalizacion(idPeriodo: number) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/estudiantes`);
  return unwrap<EstudianteFinalizacion[]>(res);
}

export async function previewCierreFinalizacion(idPeriodo: number) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/preview`);
  return unwrap(res);
}

export async function cerrarFinalizacion(idPeriodo: number) {
  // Cambio: bloquea finalizacion y habilita revision.
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/cerrar`, {
    method: "POST",
  });
  return unwrap(res);
}
