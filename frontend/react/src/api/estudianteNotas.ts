export async function obtenerMisNotas() {
  try {
    const token = localStorage.getItem("token");
    console.log(token);
    const res = await fetch("http://localhost:1234/estudiantes/mis-notas", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Error al obtener notas");

    return await res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function obtenerMiHistorial() {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(
      "http://localhost:1234/estudiantes/mis-notas/historial",
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) throw new Error("Error al obtener historial");
    return await res.json();
  } catch (error) {
    console.log(error);
    return [];
  }
}

// api/admin.ts

export async function obtenerHistorialPorEstudiante(id: number) {
  const res = await fetch(`http://localhost:1234/estudiantes/historial/${id}`);
  return res.json();
}
