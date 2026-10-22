import { useSearchParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FormularioModal } from "./FormularioModal";
import ModalContainer from "./ModalContainer";
import { AlertDemo } from "./Alert";
import { useState, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import UndoIcon from "@mui/icons-material/Undo";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import {
  estudiante_grado_rel,
  eliminar_rel_estudiante_grado,
} from "../api/estudiantes";
import { obtenerPeriodoActivo } from "@/api/periodos";
import type { Estudiantes } from "@/interfaces/interface";

import { DisponiblesAgregar } from "./DisponiblesAgregar";
import { SortableTable } from "./ui/Table";
import ButtonMUI from "@mui/material/Button";
import { OptionsModal } from "./ui/BasicModal";
import BasicModal from "./ui/AgregarEstudianteComponent";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { TablaNotasAdmin } from "./TablaNotaAdmin";

//
//
//
const MSG_SIN_PERIODO =
  "Debe existir un periodo escolar activo para agregar estudiantes.";
export default function Grado() {
  const [view, setView] = useState<"estudiantes" | "notas">("estudiantes");
  const [confirmarCambioGrado, setConfirmarCambioGrado] = useState<{
    id_estudiante: number;
    id_grado_nuevo: number;
    id_relacion: number;
    mismoAnio: boolean;
    gradoTexto: string;
  } | null>(null);
  // Nuevos estados para el flujo de cambio de grado
  const [confirmarNotasModal, setConfirmarNotasModal] = useState<{
    id_estudiante: number;
    id_grado_nuevo: number;
    id_relacion: number; // Necesitamos el ID de la relación (est.id)
  } | null>(null);
  const [loadingCambioGrado, setLoadingCambioGrado] = useState(false);
  const [sinPeriodo, setSinPeriodo] = useState(false);
  const [errorPeriodo, setErrorPeriodo] = useState("");
  const [searchParams] = useSearchParams();
  const anio = Number(searchParams.get("anio"));
  const seccion = searchParams.get("seccion")!;
  const id_grado = Number(searchParams.get("id"));
  const [showRetirar, setShowRetirar] = useState<number | null>(null);
  const [actualizarGrado, setShowActualizarGrado] = useState<number | null>(
    null,
  );

  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);

  const [showEdit, setShowEdit] = useState(false);
  const [idEstudiante] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<
    "" | "agregar" | "eliminar" | "actualizar"
  >("");
  const [openModal, setOpenModal] = useState(false);
  const [loadingPromover, setLoadingPromover] = useState<number | null>(null);
  const [errorPromover, setErrorPromover] = useState<string>("");
  const [confirmPromover, setConfirmPromover] = useState<number | null>(null);
  const [confirmRevertir, setConfirmRevertir] = useState<number | null>(null);
  const [loadingRevertir, setLoadingRevertir] = useState<number | null>(null);
  const [errorRevertir, setErrorRevertir] = useState<string>("");

  const revertirPromocion = async (id_estudiante: number) => {
    try {
      setLoadingRevertir(id_estudiante);
      const res = await fetch(
        `http://localhost:1234/promociones/promocion/revertir/${id_estudiante}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.body?.error || "Error al revertir");
      cargar();
      setConfirmRevertir(null);
    } catch (err: any) {
      setErrorRevertir(err.message);
    } finally {
      setLoadingRevertir(null);
    }
  };
  type NotaAdmin = {
    id_estudiante: number;
    nombre: string;
    apellido: string;
    id_rel_estudiante_grado: number;
    asignaturas: {
      id_rel_grado_asignatura: number;
      nombre: string;
      notas: Record<number, number | null>;
    }[];
  };

  const [notasData, setNotasData] = useState<NotaAdmin[]>([]);
  const [loadingNotas, setLoadingNotas] = useState(false);

  const promoverEstudiante = async (id_estudiante: number) => {
    try {
      setLoadingPromover(id_estudiante);
      const res = await fetch(
        `http://localhost:1234/promociones/promocion/promover/${id_estudiante}`,
        {
          method: "POST",
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data.body?.error || data.data?.error || "Error al promover",
        );
      cargar();
      setConfirmPromover(null);
    } catch (err: any) {
      setErrorPromover(err.message);
    } finally {
      setLoadingPromover(null);
    }
  };
  useEffect(() => {
    if (view === "notas") {
      cargarNotas();
    }
  }, [view]);
  const cargarNotas = async () => {
    try {
      setLoadingNotas(true);
      const periodo = await obtenerPeriodoActivo();
      // Cambio: la sabana administrativa lee notas dentro del periodo activo.
      const res = await fetch(
        `http://localhost:1234/profesor/admin/notas/grado/${id_grado}?id_periodo=${periodo.id}`,
      );
      const data = await res.json();
      setNotasData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotas(false);
    }
  };
  //
  // Función centralizada para ejecutar el cambio de grado
  const ejecutarCambioDeGrado = async (
    id_estudiante: number,
    id_grado_nuevo: number,
    id_relacion: number,
    preservarNotas: boolean,
  ) => {
    try {
      setLoadingCambioGrado(true);
      await fetch(
        `http://localhost:1234/relacion_estudiante_grados/${id_relacion}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_estudiante: id_estudiante,
            id_grado: id_grado_nuevo,
            preservarNotas,
          }),
        },
      );

      // Limpiar estados y recargar
      setShowActualizarGrado(null);
      setConfirmarNotasModal(null);
      cargar();
      setShowAlert("actualizar");
    } catch (error) {
      console.log(error);
      // Aquí podrías agregar un estado para mostrar el error en el modal si quieres
    } finally {
      setLoadingCambioGrado(false);
    }
  };
  //
  //
  async function cargar() {
    const data = await estudiante_grado_rel(Number(anio), seccion);
    setEstudiantes(data);
  }

  async function eliminarRelGradoEstudiante(id: number) {
    await eliminar_rel_estudiante_grado(id);
    cargar();
  }

  useEffect(() => {
    cargar();
  }, [anio, seccion]);

    useEffect(() => {
    obtenerPeriodoActivo()
      .then((periodo) => setSinPeriodo(!periodo?.id))
      .catch(() => setSinPeriodo(true));
  }, []);

  console.log(estudiantes);
  // ✅ Tipo para las filas de la tabla
  type FilaEstudiante = {
    nombre: string;
    apellido: string;
    cedula: number;
    telefono: string;
    correo: string;
    lugar_nacimiento: string;
    entidad_federal: string;
    acciones: React.ReactNode;
  };

  // ✅ Columnas con tipo keyof FilaEstudiante
  const columnas: {
    label: string;
    key: keyof FilaEstudiante;
    sortable?: boolean;
    width?: number;
    minWidth?: number;
  }[] = [
    { label: "Nombre", key: "nombre", sortable: true },
    { label: "Apellido", key: "apellido", sortable: true },
    { label: "Cédula", key: "cedula", sortable: true },
    { label: "Telefono", key: "telefono", sortable: true },
    { label: "Correo", key: "correo", sortable: true },
    // Cambio: muestra datos oficiales del estudiante dentro del grado.
    { label: "Lugar de nacimiento", key: "lugar_nacimiento", sortable: true },
    { label: "Entidad Federal", key: "entidad_federal", sortable: true },
    { label: "Opciones", key: "acciones", width: 240, minWidth: 240 },
  ];

  // ✅ Filas según los estudiantes
  const filas: FilaEstudiante[] = estudiantes.map((est) => ({
    nombre: est.nombre,
    apellido: est.apellido,
    cedula: est.cedula,
    telefono: est.telefono,
    correo: est.correo,
    lugar_nacimiento: est.lugar_nacimiento || "-",
    entidad_federal: est.entidad_federal || "-",
    acciones: (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* EDITAR */}
        <Tooltip title="Editar estudiante">
          <span>
            <BasicModal
              btnText={<EditIcon />}
              title="Editar estudiante"
              onSuccess={() => cargar()}
              id_estudiante={est.id_estudiante}
              nombre={est.nombre}
              apellido={est.apellido}
              cedula={est.cedula}
              correo={est.correo}
              telefono={est.telefono}
              lugar_nacimiento={est.lugar_nacimiento}
              entidad_federal={est.entidad_federal}
              id_grado={id_grado}
              buttonProps={{
                size: "medium",
                color: "primary",
                sx: { minWidth: 0, p: 0.75 },
              }}
            />
          </span>
        </Tooltip>

        {/* CAMBIAR DE GRADO */}
        <Tooltip title="Cambiar de grado">
          <IconButton
            color="info"
            onClick={() => {
              setShowActualizarGrado(est.id_estudiante), console.log(est);
            }}
          >
            <SwapHorizIcon />
          </IconButton>
        </Tooltip>

        {/* RETIRAR */}
        <Tooltip title="Retirar del grado">
          <IconButton
            color="error"
            onClick={() => setShowRetirar(est.id_estudiante)}
          >
            <PersonRemoveIcon />
          </IconButton>
        </Tooltip>

        {/* PROMOVER */}
        <Tooltip title="Finalizar año / promover">
          <IconButton
            color="success"
            onClick={() => setConfirmPromover(est.id_estudiante)}
          >
            <TrendingUpIcon />
          </IconButton>
        </Tooltip>

        {/* REVERTIR */}
        <Tooltip title="Revertir promoción">
          <IconButton
            color="warning"
            onClick={() => setConfirmRevertir(est.id_estudiante)}
          >
            <UndoIcon />
          </IconButton>
        </Tooltip>
        {/* MODAL RETIRAR */}
        <OptionsModal
          title={`Retirar estudiante de ${anio} - ${seccion.toUpperCase()}`}
          open={showRetirar === est.id_estudiante}
          onClose={() => setShowRetirar(null)}
          content={
            "Al confirmar estaría eliminando a este estudiante de este año y sección."
          }
          optionalBtn={
            <Button
              variant="danger"
              onClick={async () => {
                eliminarRelGradoEstudiante(est.id_estudiante);
                setShowAlert("eliminar");
                setShowRetirar(null);
              }}
            >
              Retirar
            </Button>
          }
        />

        {/* MODAL PROMOVER */}
        <OptionsModal
          open={confirmPromover === est.id_estudiante}
          onClose={() => {
            setConfirmPromover(null);
            setErrorPromover("");
          }}
          title={`Finalizar año escolar para ${est.nombre} ${est.apellido}`}
          content={
            <div style={{ padding: 10, textAlign: "center" }}>
              <p>
                Al finalizar el año escolar para {est.nombre} {est.apellido}{" "}
                estaria siendo promovido al siguiente año si cumple con el
                minimo exigido en todas las asignaturas. De no ser asi,
                repetiria el año actual.
              </p>
              <br />
              <p>
                <strong>¿Desea continuar?</strong>
              </p>
              {errorPromover && <p style={{ color: "red" }}>{errorPromover}</p>}
            </div>
          }
          optionalBtn={
            <Button
              variant="success"
              disabled={loadingPromover === est.id_estudiante}
              onClick={() => promoverEstudiante(est.id_estudiante)}
            >
              {loadingPromover === est.id_estudiante
                ? "Promoviendo..."
                : "Confirmar"}
            </Button>
          }
        />

        {/* MODAL REVERTIR */}
        <OptionsModal
          open={confirmRevertir === est.id_estudiante}
          onClose={() => {
            setConfirmRevertir(null);
            setErrorRevertir("");
          }}
          title="Revertir promoción"
          content={
            <div style={{ padding: 10, textAlign: "center" }}>
              <p>
                ¿Revertir la promoción de{" "}
                <strong>
                  {est.nombre} {est.apellido}
                </strong>
                ?
              </p>
              <br />
              <p>
                Al aceptar el estudiante regresara a su año escolar anterior
              </p>
              {errorRevertir && <p style={{ color: "red" }}>{errorRevertir}</p>}
            </div>
          }
          optionalBtn={
            <Button
              variant="warning"
              disabled={loadingRevertir === est.id_estudiante}
              onClick={() => revertirPromocion(est.id_estudiante)}
            >
              {loadingRevertir === est.id_estudiante
                ? "Revirtiendo..."
                : "Confirmar"}
            </Button>
          }
        />
        {/* MODAL ACTUALIZAR GRADO */}
        {/* MODAL ACTUALIZAR GRADO */}
        <OptionsModal
          title={`Actualizar grado del estudiante ${est.nombre} ${est.apellido}`}
          open={actualizarGrado === est.id_estudiante}
          onClose={() => setShowActualizarGrado(null)}
          content={
            <Box sx={{ p: 2 }}>
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mb: 3, textAlign: "center" }}
              >
                Selecciona el nuevo grado y sección para este estudiante.
              </Typography>

              {/* 🔥 USAMOS TU COMPONENTE */}
              <DisponiblesAgregar
                endPoint="http://localhost:1234/grado"
                id_componente={est.id_estudiante}
                onSuccess={() => {
                  setShowActualizarGrado(null);
                  cargar();
                  setShowAlert("actualizar");
                }}
                mode="grados"
                displayText={(grado) =>
                  `${grado.anio}° - Sección ${grado.seccion.toUpperCase()}`
                }
                onItemSelected={async (
                  id_grado_nuevo,
                  id_estudiante_actual,
                ) => {
                  try {
                    const resGrados = await fetch(
                      "http://localhost:1234/grado",
                    );
                    const grados = await resGrados.json();
                    const gradoSeleccionado = grados.find(
                      (g: any) => g.id === id_grado_nuevo,
                    );
                    const mismoAnio = gradoSeleccionado.anio === anio;
                    const gradoTexto = `${gradoSeleccionado.anio}° - Sección ${gradoSeleccionado.seccion.toUpperCase()}`;

                    // ✅ Solo guardar la información y cerrar el modal de selección
                    setConfirmarCambioGrado({
                      id_estudiante: id_estudiante_actual,
                      id_grado_nuevo,
                      id_relacion: est.id,
                      mismoAnio,
                      gradoTexto,
                    });
                    setShowActualizarGrado(null); // cerrar modal de selección
                  } catch (error) {
                    console.log(error);
                  }
                }}
              />
            </Box>
          }
        />
      </div>
    ),
  }));

  return (
    <>
      {/* ===== TOOLBAR MEJORADA ===== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          mb: 4,
          pb: 2,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          {`Año ${anio} - Sección ${seccion}`}
        </Typography>
     <Box
          onClickCapture={(e) => {
            if (!sinPeriodo) return;
            e.stopPropagation();
            setErrorPeriodo(MSG_SIN_PERIODO);
          }}
        >
        <BasicModal
          btnText="Agregar estudiante"
          title="Formulario para crear y agregar estudiante"
          id_grado={id_grado} // Pasa el id_grado real
          onSuccess={() => {
            cargar();
          }}
        />
        </Box>
        <ButtonMUI
          onClick={() => setOpenModal(true)}
          size="medium"
          variant="contained"
          startIcon={<SearchIcon />}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            boxShadow: 2,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: 4,
            },
            transition: "transform 0.2s",
          }}
        >
          Buscar
        </ButtonMUI>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, newView) => {
            if (newView !== null) setView(newView);
          }}
          size="small"
        >
          <ToggleButton value="estudiantes">Estudiantes</ToggleButton>
          <ToggleButton value="notas">Notas</ToggleButton>
        </ToggleButtonGroup>
        {/* Modales y alertas exactamente iguales */}
      </Box>
      {/* ✅ Tabla de MUI reemplazando la anterior */}
      {estudiantes.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
            bgcolor: "background.paper",
            borderRadius: 2,

            borderColor: "divider",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay estudiantes registrados en {anio} - {seccion.toUpperCase()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Utiliza el botón "Agregar estudiante" o "Buscar" para inscribir
            estudiantes.
          </Typography>
        </Box>
      ) : view === "estudiantes" ? (
        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <SortableTable<FilaEstudiante>
            columns={columnas}
            rows={filas}
            maxWidth={1200}
          />
        </Box>
      ) : loadingNotas ? (
        <Typography color="text.secondary" textAlign="center">
          Cargando notas...
        </Typography>
      ) : (
        <TablaNotasAdmin data={notasData} onReload={cargarNotas} />
      )}

      <ModalContainer
        show={showEdit}
        onClose={() => setShowEdit(false)}
        children={
          <FormularioModal
            id_to_rel={1}
            campos={["Nombre", "Apellido", "Cedula"]}
            id_estudiante={idEstudiante}
            onSuccess={() => {
              setShowEdit(false);
              setShowAlert("actualizar");
              cargar();
            }}
          />
        }
        header="Editar estudiante"
      />
      <OptionsModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Buscar estudiante para registrar"
        content={
          <DisponiblesAgregar
            endPoint="http://localhost:1234/estudiantes"
            id_componente={id_grado}
            onSuccess={() => {
              setShowRetirar(null);
              setOpenModal(false);
              cargar();
              setShowAlert("agregar");
            }}
            mode="grados"
            filterCondition={(estudiante) => estudiante.año === "Sin Asignar"}
            displayText={(estudiante) =>
              `${estudiante.nombre} ${estudiante.apellido}`
            }
          />
        }
      />
      <OptionsModal
        open={confirmarCambioGrado !== null}
        onClose={() => setConfirmarCambioGrado(null)}
        title="Confirmar cambio de grado"
        content={
          <div style={{ padding: 10, textAlign: "center" }}>
            <p>
              ¿Estás seguro de mover el estudiante al grado{" "}
              <strong>{confirmarCambioGrado?.gradoTexto}</strong>?
            </p>
            <br />
            <p>Esta acción puede afectar sus notas y su historial académico.</p>
          </div>
        }
        optionalBtn={
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <Button
              variant="secondary"
              onClick={() => setConfirmarCambioGrado(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              onClick={() => {
                const data = confirmarCambioGrado;
                if (!data) return;
                if (data.mismoAnio) {
                  // Abrir modal para preguntar por notas
                  setConfirmarNotasModal({
                    id_estudiante: data.id_estudiante,
                    id_grado_nuevo: data.id_grado_nuevo,
                    id_relacion: data.id_relacion,
                  });
                } else {
                  // Cambio de año: ejecutar sin preservar notas
                  ejecutarCambioDeGrado(
                    data.id_estudiante,
                    data.id_grado_nuevo,
                    data.id_relacion,
                    false,
                  );
                }
                setConfirmarCambioGrado(null);
              }}
            >
              Confirmar
            </Button>
          </div>
        }
      />
      {/* NUEVO MODAL: CONFIRMAR PRESERVAR NOTAS */}
      <OptionsModal
        open={confirmarNotasModal !== null}
        onClose={() => setConfirmarNotasModal(null)}
        title="Conservar Notas"
        content={
          <div style={{ padding: 10, textAlign: "center" }}>
            <p>
              Estás moviendo al estudiante a una sección del{" "}
              <strong>mismo año</strong>.
            </p>
            <br />
            <p>
              ¿Deseas conservar las notas del estudiante en las asignaturas
              compatibles?
            </p>
          </div>
        }
        optionalBtn={
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "center" }}
          >
            <Button
              variant="danger"
              disabled={loadingCambioGrado}
              onClick={() => {
                if (confirmarNotasModal) {
                  ejecutarCambioDeGrado(
                    confirmarNotasModal.id_estudiante,
                    confirmarNotasModal.id_grado_nuevo,
                    confirmarNotasModal.id_relacion,
                    false, // NO preservar notas
                  );
                }
              }}
            >
              No, resetear notas
            </Button>

            <Button
              variant="success"
              disabled={loadingCambioGrado}
              onClick={() => {
                if (confirmarNotasModal) {
                  ejecutarCambioDeGrado(
                    confirmarNotasModal.id_estudiante,
                    confirmarNotasModal.id_grado_nuevo,
                    confirmarNotasModal.id_relacion,
                    true, // SÍ preservar notas
                  );
                }
              }}
            >
              Sí, conservar notas
            </Button>
          </div>
        }
      />
      {showAlert && (
        <AlertDemo
          duration={2000}
          onClose={() => setShowAlert("")}
          action={showAlert}
        />
      )}
    </>
  );
}
