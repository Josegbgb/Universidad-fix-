import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Profesores } from "../interfaces/interface.ts";
import { obtenerAsignatura } from "@/api/grados.ts";
import {
  eliminar_profesor_asignatura_rel,
  profesor_asignatura_rel,
  obtenerProfesorPorId,
} from "@/api/profesores.ts";
import ButtonMUI from "@mui/material/Button";
import { EliminarEstudiante } from "./svg.tsx";
import { SortableTable } from "./ui/Table";
import { OptionsModal } from "./ui/BasicModal.tsx";
import { DisponiblesAgregar } from "./DisponiblesAgregar.tsx";
import { AlertDemo } from "./Alert.tsx";
import { InfoProfesor } from "./ui/InfoProfesor.tsx";
import { actualizarProfesorCompleto } from "@/api/profesores";

type FilaProfesor = {
  asignatura: string;
  anio: string;
  acciones: React.ReactNode;
};

// Interface para la asignatura a eliminar
interface AsignaturaAEliminar {
  id_relacion: number;
  nombre: string;
  anio: number;
  seccion: string;
}

export default function Profesor() {
  const [searchParams] = useSearchParams();
  const id_profesor = Number(searchParams.get("id_profesor"));
  const [buscarAsignatura, setBuscarAsignatura] = useState(false);
  const [showAlert, setShowAlert] = useState<"" | "agregar" | "eliminar">("");
  const [profesores, setProfesores] = useState<Profesores[]>([]);
  const [showConfirmarEliminar, setShowConfirmarEliminar] = useState(false);
  const [asignaturaAEliminar, setAsignaturaAEliminar] =
    useState<AsignaturaAEliminar | null>(null);
  const [profesorInfo, setProfesorInfo] = useState<Profesores | null>(null);
  const [asignaturasCapaces, setAsignaturasCapaces] = useState<any[]>([]);
  const [asignaturasQuePuedeDar, setAsignaturasQuePuedeDar] = useState<
    string[]
  >([]);
  async function guardarProfesor(data: any) {
    await actualizarProfesorCompleto(id_profesor, data);
    await cargarProfesor();
  }

  async function cargarProfesor() {
    const data = await obtenerProfesorPorId(id_profesor);
    const todasAsignaturas = await obtenerAsignatura();
    if (data?.telefono) {
      data.telefono = String(data.telefono).replace(/\D/g, "");
    }
    setAsignaturasCapaces(
      Array.isArray(todasAsignaturas) ? todasAsignaturas : [],
    );
    const puedeDarNombres = (data?.asignaturas_capaces || []).map(
      (a: any) => a.nombre,
    );
    setAsignaturasQuePuedeDar(puedeDarNombres);

    setProfesorInfo(data);
  }

  async function cargar() {
    const data: Profesores[] = await profesor_asignatura_rel(id_profesor);
    const datosFiltrados = data.filter(
      (item: Profesores) =>
        item.asignatura &&
        item.asignatura !== "Sin asignar" &&
        item.asignatura !== null,
    );

    setProfesores(datosFiltrados);
  }

  useEffect(() => {
    cargarProfesor();
    cargar();
  }, [id_profesor]);

  // ======================
  // COLUMNAS (SortableTable)
  // ======================
  const columnas = [
    { label: "Asignatura", key: "asignatura", sortable: true, width: 220 },
    { label: "Año y Seccion", key: "anio", sortable: true, width: 140 },
    {
      label: "Opciones",
      key: "acciones",
      align: "center" as const,
      width: 140,
      minWidth: 140,
    },
  ] as const;

  // ======================
  // FILAS
  // ======================
  const filas: FilaProfesor[] = profesores.map((est) => ({
    asignatura: est.asignatura,
    anio: `${est.anio} ${est.seccion?.toUpperCase() ?? ""}`,
    acciones: (
      <ButtonMUI
        variant="outlined"
        color="error"
        onClick={() => {
          setAsignaturaAEliminar({
            id_relacion: est.id!,
            nombre: est.asignatura,
            anio: est.anio,
            seccion: est.seccion,
          });
          setShowConfirmarEliminar(true);
        }}
      >
        <EliminarEstudiante />
      </ButtonMUI>
    ),
  }));

  // ======================
  // RENDER
  // ======================
  return (
    <>
      <InfoProfesor
        nombre={profesorInfo?.nombre || "Profesor no disponible"}
        apellido={profesorInfo?.apellido || "Apellido no disponible"}
        cedula={profesorInfo?.cedula || 0}
        correo={profesorInfo?.correo || "Correo no disponible"}
        telefono={profesorInfo?.telefono || "Teléfono no disponible"}
        direccion={profesorInfo?.direccion || undefined}
        asignaturas={profesorInfo?.asignaturas_capaces || []}
        asignaturasDisponibles={asignaturasCapaces}
        onSave={guardarProfesor}
      />
      <div
        style={{
          margin: "20px 0",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ButtonMUI
          variant="contained"
          onClick={() => setBuscarAsignatura(true)}
        >
          Agregar asignatura
        </ButtonMUI>
      </div>

      {profesores.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          Sin asignaturas
        </div>
      ) : (
        <SortableTable
          columns={columnas}
          maxWidth={1200}
          rows={filas}
        />
      )}

      {/* ================= MODAL BUSCAR ================= */}

      {/* ================= ALERT ================= */}
      {showAlert && (
        <AlertDemo
          action={showAlert}
          duration={2000}
          onClose={() => setShowAlert("eliminar")}
        />
      )}

      <OptionsModal
        open={showConfirmarEliminar}
        onClose={() => {
          setShowConfirmarEliminar(false);
          setAsignaturaAEliminar(null);
        }}
        title="Confirmar eliminación"
        content={
          <div>
            <p>
              ¿Estás seguro de que deseas eliminar al profesor de{" "}
              <strong>{asignaturaAEliminar?.nombre}</strong> del año{" "}
              <strong>
                {asignaturaAEliminar?.anio}{" "}
                {asignaturaAEliminar?.seccion?.toUpperCase()}
              </strong>
              ?
            </p>
            <p className="text-sm text-red-500">
              Esta acción no se puede deshacer.
            </p>
          </div>
        }
        optionalBtn={
          <ButtonMUI
            variant="contained"
            color="warning"
            onClick={async () => {
              setShowConfirmarEliminar(false);

              await eliminar_profesor_asignatura_rel(
                asignaturaAEliminar?.id_relacion!,
              );
              cargar();
              setAsignaturaAEliminar(null);
            }}
          >
            Aceptar
          </ButtonMUI>
        }
      />

      <OptionsModal
        open={buscarAsignatura} // Cambiado de openModal a showDisponibles
        onClose={() => setBuscarAsignatura(false)}
        title="Buscar asignatura para registrar"
        content={
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 14, opacity: 0.8 }}>
              Selecciona una asignatura disponible para asignarla a este
              profesor.
            </p>
            <DisponiblesAgregar<{
              id: number;
              relacion_id: number; // Este es el id_rel_grado_asignatura
              nombre: string;
              asignatura: string;
              anio: number;
              seccion: string;
              profesor_asignado: string | null;
            }>
              endPoint="http://localhost:1234/relacion_grado_asignatura"
              id_componente={id_profesor}
              onSuccess={() => {
                cargar();
                setBuscarAsignatura(false);
                setShowAlert("agregar");
              }}
              mode="asignatura_profesor"
              filterCondition={(item) => {
                // 👇 Usar asignaturasQuePuedeDar en lugar de asignaturasCapaces
                const puedeDar = asignaturasQuePuedeDar.some(
                  (nombreAsig: string) =>
                    nombreAsig === (item.asignatura || item.nombre),
                );
                const sinProfesor =
                  item.profesor_asignado === "Sin Asignar" ||
                  item.profesor_asignado === null;
                return sinProfesor && puedeDar;
              }}
              // Función para mostrar el texto correctamente
              displayText={(item) =>
                `${item.asignatura || item.nombre} - ${item.anio} ${item.seccion?.toUpperCase() || ""}`
              }
            />
          </div>
        }
      />
    </>
  );
}
