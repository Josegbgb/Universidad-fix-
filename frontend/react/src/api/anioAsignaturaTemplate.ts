// templates.ts
export async function obtenerTemplatePorAnio(anio: number) {
  try {
    const response = await fetch(
      `http://localhost:1234/anio_asignatura_template/${anio}`,
    );
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error obteniendo template:", error);
    throw error;
  }
}

export async function agregarAsignaturaTemplate(
  anio: number,
  id_asignatura: number,
) {
  try {
    const response = await fetch(
      "http://localhost:1234/anio_asignatura_template",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anio,
          id_asignatura,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error agregando asignatura template:", error);
    throw error;
  }
}

export async function eliminarAsignaturaTemplate(
  anio: number,
  id_asignatura: number,
) {
  try {
    console.log("anio", anio, "id_asignatura", id_asignatura);
    const response = await fetch(
      `http://localhost:1234/anio_asignatura_template/${anio}/${id_asignatura}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error eliminando asignatura template:", error);
    throw error;
  }
}
