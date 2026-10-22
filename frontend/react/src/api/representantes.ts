const representantes_url = "http://localhost:1234/representantes";
const representantes_estudiantes_rel =
  "http://localhost:1234/relacion_estudiante_representantes";

import type { Representantes } from "@/interfaces/interface";
//
//
export async function obtenerRepresentantes() {
  try {
    const res = await fetch(representantes_url);
    return await res.json();
  } catch (error) {
    console.error("Error obteniendo representantes:", error);
    throw error;
  }
}
//
//
//
export async function crearRepresentantes(representante: Representantes) {
  const res = await fetch(representantes_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(representante),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Error al crear representante");
  }

  return data;
}
//
//
export async function actualizarRepresentante(
  id_estudiante: number,
  data: Representantes,
) {
  try {
    const res = await fetch(`${representantes_url}/${id_estudiante}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(
        responseData.message || "Error al actualizar representante",
      );
    }

    return responseData;
  } catch (error) {
    console.error("Error actualizando representante:", error);
    throw error;
  }
}

export async function eliminarRepresentantes(id_representante: number) {
  try {
    const res = await fetch(`${representantes_url}/${id_representante}`, {
      method: "DELETE",
    });
    return await res.ok;
  } catch (error) {
    console.error("Error eliminando representante:", error);
    throw error;
  }
}
//
//
export async function obtener_rel_representante_estudiante() {
  try {
    const res = await fetch(representantes_estudiantes_rel);
    return await res.json();
  } catch (error) {
    console.error("Error obteniendo relación:", error);
    throw error;
  }
}
//
//
export async function crear_rel_representante_estudiante(data: {
  id_estudiante: number;
  id_representante: number;
  parentesco: string;
}) {
  try {
    const res = await fetch(representantes_estudiantes_rel, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Error creando relación:", error);
    throw error;
  }
}
//
//
export async function actualizar_rel_represeante_estudiante(
  id_estudiante: number,
  data: Representantes,
) {
  try {
    const res = await fetch(
      `${representantes_estudiantes_rel}/${id_estudiante}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
    );
    return await res.json();
  } catch (error) {
    console.error("Error actualizando relación:", error);
    throw error;
  }
}
//
//
export async function eliminar_rel_representante_estudiante(id_rel: number) {
  try {
    const res = await fetch(`${representantes_estudiantes_rel}/${id_rel}`, {
      method: "DELETE",
    });
    return await res.ok;
  } catch (error) {
    console.error("Error eliminando relación:", error);
    throw error;
  }
}
export async function hardDeleteRepresentante(id_representante: number) {
  const res = await fetch(`${representantes_url}/hard/${id_representante}`, {
    method: "DELETE",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Error al eliminar representante permanentemente",
    );
  }

  return data;
}
