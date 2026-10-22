const formulario = document.getElementById("formulario");

formulario.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombreInput").value;
  const apellido = document.getElementById("apellidoInput").value;
  const cedula = Number(document.getElementById("cedulaInput").value);

  const body = { nombre, apellido, cedula };
  console.log(body);

  const response = await fetch("http://localhost:1234/estudiantes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  console.log(data);
  location.reload();
});

const container_estudiantes = document.getElementById("contanier_estudiantes");

fetch("http://localhost:1234/estudiantes")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    const fragment = document.createDocumentFragment();
    data.forEach((estudiante) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td class="nombre_table">${estudiante.nombre}</td>
        <td class="apellido_table">${estudiante.apellido}</td>
        <td class="cedula_table">${estudiante.cedula}</td>
        <td class="año_table">${estudiante.año}</td>
        <td class="seccion_table">${estudiante.seccion}</td>
        <button type="button" class="eliminar_estudiante" data-id=${estudiante.id}>Eliminar</button>
        `;
      fragment.appendChild(fila);
    });
    container_estudiantes.innerHTML = "";
    container_estudiantes.appendChild(fragment);

    document.querySelectorAll(".eliminar_estudiante").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        eliminarEstudiante(id);
      });
    });
  });

function eliminarEstudiante(id) {
  fetch(`http://localhost:1234/estudiantes/${id}`, {
    method: "DELETE",
  }).catch((error) => console.log("Error", error));
  location.reload();
}
