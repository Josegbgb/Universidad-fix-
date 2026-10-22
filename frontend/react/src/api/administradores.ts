import type { Administrador } from "@/interfaces/interface";

const API_URL = "http://localhost:1234/administradores";

// ===============================
// 🔍 OBTENER TODOS
// ===============================
export async function obtenerAdministradores() {
  const email = localStorage.getItem("email");
  const res = await fetch(`${API_URL}?emailExcluir=${email}`);

  if (!res.ok) {
    throw new Error("Error al obtener administradores");
  }

  return res.json();
}

// ===============================
// 🗑️ OBTENER ELIMINADOS
// ===============================
export async function obtenerAdministradoresEliminados(): Promise<
  Administrador[]
> {
  const res = await fetch(`${API_URL}/deleted`);

  if (!res.ok) {
    throw new Error("Error al obtener eliminados");
  }

  return res.json();
}

// ===============================
// 🔎 OBTENER POR ID
// ===============================
export async function obtenerAdministradorPorId(
  id: number,
): Promise<Administrador> {
  const res = await fetch(`${API_URL}/byid/${id}`);

  if (!res.ok) {
    throw new Error("Administrador no encontrado");
  }

  return res.json();
}

// ===============================
// 🔎 OBTENER POR CÉDULA
// ===============================
export async function obtenerAdministradorPorCedula(
  cedula: number,
): Promise<Administrador> {
  const res = await fetch(`${API_URL}/${cedula}`);

  if (!res.ok) {
    throw new Error("Administrador no encontrado");
  }

  return res.json();
}

// ===============================
// ➕ CREAR
// ===============================
export async function crearAdministrador(data: {
  nombre: string;
  apellido: string;
  cedula: number;
  correo: string;
  telefono?: string;
  direccion?: string;
}) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || "Error al crear administrador");
  }

  return json;
}

// ===============================
// ✏️ ACTUALIZAR PARCIAL
// ===============================
export async function actualizarAdministrador(
  id: number,
  data: Partial<Administrador>,
) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Error al crear administrador");
  }

  return json;
}

// ===============================
// ✏️ ACTUALIZAR COMPLETO (tu caso)
// ===============================
export async function actualizarAdministradorCompleto(
  id: number,
  data: Partial<Administrador>,
) {
  return actualizarAdministrador(id, data);
}

// ===============================
// 🗑️ SOFT DELETE
// ===============================
export async function eliminarAdministrador(id: number) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Error al eliminar administrador");
  }

  return res.json();
}

// ===============================
// ♻️ RESTORE
// ===============================
export async function restaurarAdministrador(id: number) {
  const res = await fetch(`${API_URL}/${id}/restore`, {
    method: "PATCH",
  });

  if (!res.ok) {
    throw new Error("Error al restaurar administrador");
  }

  return res.json();
}
