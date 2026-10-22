import { fetchWithAuth } from "./apiClient";

const API_URL = "http://localhost:1234/periodos";

export type PeriodoEscolar = {
  id: number;
  nombre: string;
  activo: number;
  cerrado: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
};

export type FasePeriodo = {
  id: number;
  id_periodo: number;
  fase: string;
  abierta: number;
  cerrada_at?: string | null;
};

export type PeriodoResumen = PeriodoEscolar & {
  fases: FasePeriodo[];
  conteos: Array<{ estado: string; total: number }>;
};

async function unwrap<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
        data?.body?.mensaje ??
        data?.body?.error ??
        data?.error ??
        data?.message ??
        "ERROR_PERIODO",
    );
  }
  return (data?.body ?? data) as T;
}

export async function obtenerPeriodos() {
  const res = await fetchWithAuth(API_URL);
  return unwrap<PeriodoEscolar[]>(res);
}

export async function obtenerPeriodoActivo() {
  const res = await fetchWithAuth(`${API_URL}/activo`);
  return unwrap<PeriodoEscolar>(res);
}

export async function obtenerResumenPeriodo(idPeriodo: number) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/resumen`);
  return unwrap<PeriodoResumen>(res);
}

export async function crearPeriodo(data: {
  nombre: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}) {
  // Cambio: permite crear el periodo inicial desde la UI administrativa.
  const res = await fetchWithAuth(API_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return unwrap<PeriodoEscolar>(res);
}

export async function activarPeriodo(idPeriodo: number) {
  // Cambio: permite activar un periodo existente que no este cerrado.
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/activar`, {
    method: "PATCH",
  });
  return unwrap<PeriodoEscolar>(res);
}

export async function cerrarRevisionPeriodo(idPeriodo: number) {
  // Cambio: cierre de revision sincroniza revision y nuevo periodo.
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/revision/cerrar`, {
    method: "POST",
  });
  return unwrap(res);
}

export async function abrirRevisionEspecial(idPeriodo: number) {
  const res = await fetchWithAuth(`${API_URL}/${idPeriodo}/revision-especial/abrir`, {
    method: "POST",
  });
  return unwrap(res);
}
