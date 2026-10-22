const api_url = "http://localhost:1234/grado";
const api_url_rel_grado_asignatura =
  "http://localhost:1234/relacion_grado_asignatura";
const api_url_rel_asignatura_profesor =
  "http://localhost:1234/relacion_asignatura_profesor";
const asignatura_url = "http://localhost:1234/asignaturas";

//
//
//
export async function obtenerGrados() {
  const res = await fetch(api_url);
  return await res.json();
}

export async function eliminarGrado(id: number) {
  try {
    const res = await fetch(`${api_url}/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message); // 👈 lanza el error del backend

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
//
//
//
export async function obtenerGradosDeshabilitados() {
  const res = await fetch(`${api_url}/deshabilitados`);
  return await res.json();
}

export async function deshabilitarGrado(id: number) {
  try {
    const res = await fetch(`${api_url}/${id}/deshabilitar`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message); // lanza el error del backend

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function habilitarGrado(id: number) {
  try {
    const res = await fetch(`${api_url}/${id}/habilitar`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message);

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
//
//
//
export async function crearGrado(data: { anio: number; seccion: string }) {
  try {
    const res = await fetch("http://localhost:1234/grado", {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function obtenerRelacionesPorAnio(anio: number) {
  try {
    const res = await fetch(`${api_url_rel_grado_asignatura}?anio=${anio}`);
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function rel_grado_asignatura() {
  const res = await fetch(api_url_rel_grado_asignatura);
  return await res.json();
}
//
export async function eliminar_rel_grado_asignatura(
  anio: number,
  asignatura: string,
) {
  try {
    const res = await fetch(
      `${api_url_rel_grado_asignatura}/${anio}/${asignatura}`,
      {
        method: "DELETE",
      },
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
//
export async function create_rel_asignatura_profesor(data: {
  id_rel_grado_asignatura: number;
  id_profesor: number;
}) {
  try {
    const res = await fetch(api_url_rel_asignatura_profesor, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.log(error);
  }
}

export async function obtenerAsignatura() {
  try {
    const res = await fetch(asignatura_url);
    const data = await res.json();

    // 👇 si no es array, retorna vacío
    if (!Array.isArray(data)) return [];

    return data;
  } catch (error) {
    console.log(error);
    return []; // 👈 también protege el catch
  }
}

export async function crearAsignatura(dataNombre: { asignatura: string }) {
  try {
    const res = await fetch(asignatura_url, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(dataNombre),
    });
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function crearRelGradoAsignatura(data: {
  id_asignatura: number;
  anio: number;
}) {
  try {
    const res = await fetch(api_url_rel_grado_asignatura, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
      },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.log(error);
  }
}

export const actualizarAsignatura = async (id: number, nombre: string) => {
  const res = await fetch(`http://localhost:1234/asignaturas/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ asignatura: nombre }),
  });

  const data = await res.json();
  return data;
};
