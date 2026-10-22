const URL = "http://localhost:1234";

// ==========================
// OBTENER ELIMINADOS
// ==========================
export async function getAdminsDeleted() {
  const res = await fetch(`${URL}/administradores/deleted`);
  return await res.json();
}

export async function getProfesoresDeleted() {
  const res = await fetch(`${URL}/profesores/deleted`);
  return await res.json();
}

export async function getEstudiantesDeleted() {
  const res = await fetch(`${URL}/estudiantes/deleted`);
  return await res.json();
}

export async function getRepresentantesDeleted() {
  const res = await fetch(`${URL}/representantes/deleted`);
  return await res.json();
}

// ==========================
// RESTORE
// ==========================
export async function restoreAdmin(id: number) {
  await fetch(`${URL}/administradores/${id}/restore`, { method: "PATCH" });
}

export async function restoreProfesor(id: number) {
  await fetch(`${URL}/profesores/${id}/restore`, { method: "PATCH" });
}

export async function restoreEstudiante(id: number) {
  await fetch(`${URL}/estudiantes/${id}/restore`, { method: "PATCH" });
}

export async function restoreRepresentante(id: number) {
  await fetch(`${URL}/representantes/restore/${id}`, {
    method: "PATCH",
  });
}

// ==========================
// HARD DELETE
// ==========================
export async function deleteAdmin(id: number) {
  await fetch(`${URL}/administradores/${id}`, { method: "DELETE" });
}

export async function deleteProfesor(id: number) {
  await fetch(`${URL}/profesores/${id}`, { method: "DELETE" });
}

export async function deleteEstudiante(id: number) {
  await fetch(`${URL}/estudiantes/hard-delete/${id}`, {
    method: "DELETE",
  });
}

export async function deleteRepresentante(id: number) {
  await fetch(`${URL}/representantes/${id}`, {
    method: "DELETE",
  });
}

export async function obtenerEstudiantesEgresados() {
  const res = await fetch(`http://localhost:1234/estudiantes/egresados`);
  return await res.json();
}
