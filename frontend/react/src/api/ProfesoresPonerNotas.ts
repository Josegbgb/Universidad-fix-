import { obtenerPeriodoActivo } from "./periodos";

export async function obtenerMisAsignaciones(correo: string) {
  const res = await fetch(
    `http://localhost:1234/profesor/mis-asignaciones/${correo}`,
  );

  if (!res.ok) throw new Error("Error al obtener asignaciones");

  return await res.json();
}

export async function cargarMisAsignaturasEstudiantes(id_rel: number) {
  const res = await fetch(
    `http://localhost:1234/profesor/asignaciones/${id_rel}`,
  );

  if (!res.ok) throw new Error("Error al obtener asignaciones");

  return await res.json();
}

export async function obtenerNotasAsignacion(id_rel: number, idPeriodo?: number) {
  // Cambio: las notas se leen dentro del periodo activo o seleccionado.
  const periodo = idPeriodo ?? (await obtenerPeriodoActivo()).id;
  const res = await fetch(
    `http://localhost:1234/profesor/notas/${id_rel}?id_periodo=${periodo}`,
  );
  console.log(res);
  if (!res.ok) throw new Error("Error al obtener notas");

  return await res.json();
}

export async function guardarNota(data: {
  id_rel_estudiante_grado: number;
  id_rel_grado_asignatura: number;
  id_lapso: number;
  nota: number | "IN" | null;
}) {
  const res = await fetch(`http://localhost:1234/profesor/notas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error("Error al guardar nota");

  return await res.json();
}
