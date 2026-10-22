import type { Profesores } from "@/interfaces/interface";

const api_url = "http://localhost:1234/profesores";

export async function obtenerProfesores() {
  try {
    const res = await fetch(api_url);
    return await res.json();
  } catch (error) {
    console.log(error);
  }
}

export async function crearProfesor(profesor: Profesores) {
  try {
    const res = await fetch("http://localhost:1234/profesores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profesor),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Error al crear profesor");
    }
    return result;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function profesor_asignatura_rel(id_profesor: number) {
  try {
    const res = await fetch(
      `http://localhost:1234/relacion_asignatura_profesor/${id_profesor}`,
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function obtenerProfesoresConCapacidades() {
  try {
    const res = await fetch("http://localhost:1234/profesores/con-capacidades");
    return await res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}
export async function crear_profesor_asignatura_rel(data: {
  id_rel_grado_asignatura: number;
  id_profesor: number;
}) {
  try {
    console.log("Aca");
    console.log(data.id_profesor, data.id_rel_grado_asignatura);
    const res = await fetch(
      "http://localhost:1234/relacion_asignatura_profesor",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function eliminar_profesor_asignatura_rel(id_relacion: number) {
  try {
    const res = await fetch(
      `http://localhost:1234/relacion_asignatura_profesor/${id_relacion}`,
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

export async function eliminarProfesor(id_relacion: number) {
  try {
    const res = await fetch(`${api_url}/${id_relacion}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
////////////
///////////
///////////
export async function crearProfesorAsignaturas(data: {
  id_profesor: number;
  id_rel_grado_asignatura: number;
}) {
  try {
    const res = await fetch(
      "http://localhost:1234/relacion_asignatura_profesor",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}
export async function obtenerProfesorPorId(id_profesor: number) {
  try {
    console.log("Obteniendo profesor por ID:", id_profesor);
    const res = await fetch(
      `http://localhost:1234/profesores/byid/${id_profesor}`,
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function guardarAsignaturasProfesorTemplate(
  id_profesor: number,
  asignaturas: number[],
) {
  try {
    const res = await fetch(
      `http://localhost:1234/asignatura_profesor_template/${id_profesor}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asignaturas }),
      },
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function asignaturasParaProfesor(id_profesor: number) {
  try {
    const res = await fetch(
      `http://localhost:1234/asignatura_profesor_template/${id_profesor}`,
    );
    return await res.json();
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function actualizarProfesorCompleto(
  id_profesor: number,
  data: any,
) {
  try {
    const body: any = {};

    if (data.nombre) body.nombre = data.nombre;
    if (data.apellido) body.apellido = data.apellido;
    if (data.cedula) body.cedula = Number(data.cedula);
    if (data.correo) body.correo = data.correo;
    if (data.telefono) body.telefono = data.telefono;
    if (data.direccion) body.direccion = data.direccion;

    // 🔥 SOLO actualizar profesor si hay campos
    if (Object.keys(body).length > 0) {
      const resProfesor = await fetch(
        `http://localhost:1234/profesores/${id_profesor}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      const result = await resProfesor.json();

      if (!resProfesor.ok) {
        throw new Error(result.message || "Error al actualizar profesor");
      }
    }

    // ✅ actualizar asignaturas SIEMPRE
    if (data.asignaturasIds) {
      const resAsignaturas = await fetch(
        `http://localhost:1234/asignatura_profesor_template/${id_profesor}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            asignaturas: data.asignaturasIds,
          }),
        },
      );

      if (!resAsignaturas.ok) {
        throw new Error("Error actualizando asignaturas");
      }
    }

    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
