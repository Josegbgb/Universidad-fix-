import { useEffect, useState, type ReactNode } from "react";
import ButtonMUI from "@mui/material/Button";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { SortableTable } from "./ui/Table";
import { OptionsModal } from "./ui/BasicModal";
import { AlertDemo } from "./Alert";

import {
  getAdminsDeleted,
  getProfesoresDeleted,
  getEstudiantesDeleted,
  getRepresentantesDeleted,
  restoreAdmin,
  restoreProfesor,
  restoreEstudiante,
  restoreRepresentante,
  deleteAdmin,
  deleteProfesor,
  deleteEstudiante,
  deleteRepresentante,
} from "@/api/papelera";

type FilaPapeleraBase = {
  nombre: string;
  apellido: string;
  cedula: string | number;
  acciones: ReactNode;
};

type FilaPapeleraEstudiante = FilaPapeleraBase & {
  rep1: string;
  rep2: string;
};

export default function Papelera() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [confirm, setConfirm] = useState(false);
  const [showAlert, setShowAlert] = useState<"" | "actualizar" | "eliminar">(
    "",
  );

  async function cargar() {
    let res = [];

    if (tab === 0) res = await getAdminsDeleted();
    if (tab === 1) res = await getProfesoresDeleted();
    if (tab === 2) res = await getEstudiantesDeleted();
    if (tab === 3) res = await getRepresentantesDeleted();

    setData(res);
  }

  useEffect(() => {
    cargar();
  }, [tab]);

  // Definir columnas condicionalmente según la pestaña
  const columnasEstudiante = [
    { label: "Nombre", key: "nombre", sortable: true },
    { label: "Apellido", key: "apellido", sortable: true },
    { label: "Cédula", key: "cedula", sortable: true },
    { label: "Primer Representante", key: "rep1", sortable: false },
    { label: "Segundo Representante", key: "rep2", sortable: false },
    { label: "Opciones", key: "acciones", align: "center" as const },
  ] as const;

  const columnasDefault = [
    { label: "Nombre", key: "nombre", sortable: true },
    { label: "Apellido", key: "apellido", sortable: true },
    { label: "Cédula", key: "cedula", sortable: true },
    { label: "Opciones", key: "acciones", align: "center" as const },
  ] as const;

  async function handleRestore(item: any) {
    if (tab === 0) await restoreAdmin(item.id);
    if (tab === 1) await restoreProfesor(item.id);
    if (tab === 2) await restoreEstudiante(item.id);
    if (tab === 3) await restoreRepresentante(item.id);

    setShowAlert("actualizar");
    cargar();
  }

  async function handleDelete() {
    if (tab === 0) await deleteAdmin(selected.id);
    if (tab === 1) await deleteProfesor(selected.id);
    if (tab === 2) await deleteEstudiante(selected.id);
    if (tab === 3) await deleteRepresentante(selected.id);

    setConfirm(false);
    setSelected(null);
    setShowAlert("eliminar");
    cargar();
  }

  const filas = data.map((item): FilaPapeleraBase | FilaPapeleraEstudiante => {
    const base = {
      nombre: item.nombre,
      apellido: item.apellido,
      cedula: item.cedula,
      acciones: (
        <>
          <ButtonMUI
            color="success"
            variant="outlined"
            onClick={() => handleRestore(item)}
          >
            Restaurar
          </ButtonMUI>

          <ButtonMUI
            color="error"
            variant="outlined"
            onClick={() => {
              setSelected(item);
              setConfirm(true);
            }}
            style={{ marginLeft: "8px" }}
          >
            Eliminar
          </ButtonMUI>
        </>
      ),
    };
    if (tab === 2) {
      // pestaña estudiantes
      const reps = item.representantes || [];
      const rep1 = reps[0]
        ? `${reps[0].nombre} ${reps[0].apellido} (${reps[0].parentesco})`
        : "Ninguno";
      const rep2 = reps[1]
        ? `${reps[1].nombre} ${reps[1].apellido} (${reps[1].parentesco})`
        : "Ninguno";
      return { ...base, rep1, rep2 };
    }
    return base;
  });

  return (
    <>
      <h2>Papelera</h2>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab label="Administradores" />
        <Tab label="Profesores" />
        <Tab label="Estudiantes" />
      </Tabs>

      {data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Sin registros eliminados
        </div>
      ) : tab === 2 ? (
        // Cambio: separa columnas y filas de estudiantes para conservar tipado estricto.
        <SortableTable
          columns={columnasEstudiante}
          rows={filas as FilaPapeleraEstudiante[]}
        />
      ) : (
        <SortableTable
          columns={columnasDefault}
          rows={filas as FilaPapeleraBase[]}
        />
      )}

      {showAlert && (
        <AlertDemo
          action={showAlert}
          duration={2000}
          onClose={() => setShowAlert("")}
        />
      )}

      <OptionsModal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Eliminar definitivamente"
        content={
          <p>
            ¿Seguro que deseas eliminar a{" "}
            <strong>
              {selected?.nombre} {selected?.apellido}
            </strong>
            ?
          </p>
        }
        optionalBtn={
          <ButtonMUI color="error" variant="contained" onClick={handleDelete}>
            Eliminar
          </ButtonMUI>
        }
      />
    </>
  );
}
