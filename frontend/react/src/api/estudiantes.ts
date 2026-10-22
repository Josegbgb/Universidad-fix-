const api_url = "http://localhost:1234/estudiantes";
const api_url_relacion = "http://localhost:1234/relacion_estudiante_grados";
import type { EstudianteCreate } from "@/interfaces/interface";
import { fetchWithAuth } from "../api/apiClient";

//
export async function obtenerEstudiantes() {
  const res = await fetchWithAuth(api_url);
  return await res.json();
}
export async function estudiante_grado_rel(anio: number, seccion: string) {
  const res = await fetchWithAuth(
    `${api_url_relacion}?anio=${anio}&seccion=${seccion}`,
  );
  return await res.json();
}
export async function crear_estudiante(estudiante: EstudianteCreate) {
  const res = await fetchWithAuth(api_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(estudiante),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear estudiante");
  }
  if (data.estudiante) {
    return data.estudiante; // Si viene anidado en "estudiante"
  }
  console.log("✅ ESTUDIANTE CREADO:", data); // 👈 VERIFICA AQUÍ

  return data;
}
//
export async function crear_estudiante_rel(data: {
  id_estudiante: number;
  id_grado: number;
}) {
  try {
    const res = await fetchWithAuth(api_url_relacion, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.log(error);
  }
}

export async function eliminar_rel_estudiante_grado(id_estudiante: number) {
  try {
    const res = await fetchWithAuth(
      `http://localhost:1234/relacion_estudiante_grados/${id_estudiante}`,
      {
        method: "DELETE",
      },
    );
    return await res.ok;
  } catch (error) {
    console.log(error);
  }
}

export async function eliminarEstudiante(id_estudiante: number) {
  try {
    const res = await fetchWithAuth(
      `http://localhost:1234/estudiantes/${id_estudiante}`,
      {
        method: "DELETE",
      },
    );
    return await res.ok;
  } catch (error) {
    console.log(error);
  }
}

export async function actualizarEstudiante(
  id_estudiante: number,
  data: EstudianteCreate,
) {
  try {
    const res = await fetchWithAuth(
      `http://localhost:1234/estudiantes/${id_estudiante}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Error al actualizar estudiante");
    }
    return result;
  } catch (error) {
    console.log(error);
    throw error; // 👈 CRÍTICO
  }
}
// estudiantes.ts
export async function hardDeleteEstudiante(id_estudiante: number) {
  const res = await fetchWithAuth(
    `http://localhost:1234/estudiantes/hard/${id_estudiante}`,
    {
      method: "DELETE",
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Error al eliminar estudiante permanentemente",
    );
  }

  return data;
}
