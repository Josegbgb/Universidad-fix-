const container_grados = document.getElementById("grados_container");

fetch("http://localhost:1234/grado")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    const fragmento = document.createDocumentFragment();
    data.forEach((grado) => {
      const div = document.createElement("div");
      div.classList.add("grado");
      const box = `<img src="" alt="" srcset="">
            <p>${grado.anio}</p> - <p>${grado.seccion}</p>`;
      div.innerHTML = box;
      fragmento.appendChild(div);
    });
    container_grados.innerHTML = "";
    container_grados.appendChild(fragmento);
  });
