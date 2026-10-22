import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SortableTable } from "./ui/Table";
import { AlertDemo } from "./Alert";
import { obtenerEstudiantesEgresados } from "@/api/papelera";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { IconButton, Tooltip } from "@mui/material";

export default function EgresadosEstudiantes() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [showAlert, setShowAlert] = useState<"" | "actualizar">("");
  const [agrupados, setAgrupados] = useState<any[]>([]);

  async function cargar() {
    const res = await obtenerEstudiantesEgresados();
    // Asegurar que res sea un array
    const datosArray = Array.isArray(res) ? res : [];
    setData(datosArray);
  }
  useEffect(() => {
    cargar();
  }, []);
  useEffect(() => {
    if (data.length === 0) {
      setAgrupados([]);
      return;
    }

    const agrupadosTemp = {} as Record<string, any>;

    data.forEach((item) => {
      if (!agrupadosTemp[item.id]) {
        agrupadosTemp[item.id] = {
          id: item.id,
          nombre: item.nombre,
          apellido: item.apellido,
          cedula: item.cedula,
          telefono: item.telefono,
          representantes: [],
        };
      }

      // Agregar representante si existe
      if (item.id_representante) {
        agrupadosTemp[item.id].representantes.push({
          nombre: item.nombre_representante,
          apellido: item.apellido_representante,
          parentesco: item.parentesco,
          telefono: item.telefono_representante,
        });
      }
    });

    const resultado = Object.values(agrupadosTemp);
    setAgrupados(resultado);
    console.log("Datos agrupados:", resultado);
  }, [data]);

  const verHistorial = (id: number) => {
    navigate(`/admin/dashboard/egresados/historial?id_estudiante=${id}`, {
      state: { from: "/admin/dashboard/egresados" },
    });
  };

  console.log(agrupados);

  const columnas = [
    { label: "Nombre", key: "nombre", sortable: true },
    { label: "Apellido", key: "apellido", sortable: true },
    { label: "Telefono", key: "telefono", sortable: true },
    { label: "Cédula", key: "cedula", sortable: true },
    { label: "Representantes", key: "representantes", sortable: true },
    { label: "Parentesco", key: "parentesco", sortable: true },
    {
      label: "Telefono del Representante",
      key: "telefonoRepresentante",
      sortable: true,
    },

    {
      label: "Opciones",
      key: "acciones",
      align: "center" as const,
    },
  ] as const;

  const filas = agrupados.map((est) => ({
    nombre: est.nombre,
    apellido: est.apellido,
    cedula: est.cedula,
    telefono: est.telefono,
    representantes: est.representantes
      .map((rep: any) => `${rep.nombre} ${rep.apellido}`)
      .join(", "),
    telefonoRepresentante: est.representantes
      .map((rep: any) => rep.telefono)
      .join(", "),
    parentesco: est.representantes.map((rep: any) => rep.parentesco).join(", "),
    acciones: (
      <Tooltip title="Ver historial académico">
        <IconButton
          onClick={() => verHistorial(est.id)}
          color="primary"
          size="small"
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
    ),
  }));
  return (
    <>
      <h2>Egresados</h2>

      {agrupados.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          No hay egresados
        </div>
      ) : (
        <SortableTable columns={columnas} rows={filas} />
      )}

      {showAlert && (
        <AlertDemo
          action={showAlert}
          duration={2000}
          onClose={() => setShowAlert("")}
        />
      )}
    </>
  );
}
