import React from "react";
import { useEffect, useState, type ReactNode } from "react";
import {
  deshabilitarGrado,
  eliminarGrado,
  habilitarGrado,
  obtenerGrados,
  obtenerGradosDeshabilitados,
} from "../api/grados.ts";
import { Routes, Route, Link } from "react-router-dom";
import Grado from "./Grado.tsx";
import { eliminarProfesor, obtenerProfesores } from "@/api/profesores.ts";
import type { Grados, Profesores } from "../interfaces/interface.ts";
import Profesor from "./Profesor.tsx";
import { Asignaturas } from "./Asignaturas.tsx";
import { Button } from "react-bootstrap";
import { Trash } from "./svg.tsx";
import ButtonMUI from "@mui/material/Button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import { FormularioModal } from "./FormularioModal.tsx";
import { OptionsModal } from "./ui/BasicModal.tsx";
import BlockIcon from "@mui/icons-material/Block";
import RestoreIcon from "@mui/icons-material/Restore";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import GradosTemplate from "./GradosTemplate.tsx";
import TemplateAnio from "./AnioTemplate.tsx";
import PromoverEstudiantesBtn from "./Promover.tsx";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import { alpha } from "@mui/material/styles";
import AcademicProcess from "./AcademicProcess.tsx";
//
//
function esGrado(value: unknown): value is Grados {
  if (!value || typeof value !== "object") return false;
  const grado = value as Partial<Grados>;
  return (
    typeof grado.id === "number" &&
    typeof grado.anio === "number" &&
    typeof grado.seccion === "string"
  );
}

export function GradosList() {
  const [grados, setGrados] = useState<Grados[]>([]);
  const [showModal, setshowModal] = useState<number | null | string>(null);
  const [selectedCard, setSelectedCard] = React.useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  async function cargar() {
    const data = await obtenerGrados();
    setGrados(data);
    setRefreshKey((k) => k + 1);
  }
  // Cambio: grados deshabilitados
  const [deshabilitados, setDeshabilitados] = useState<Grados[]>([]);
  const [errorDeshab, setErrorDeshab] = useState("");

  async function cargarDeshabilitados() {
    const data = await obtenerGradosDeshabilitados();
    setDeshabilitados(Array.isArray(data) ? data : []);
  }

  async function handleHabilitar(id: number) {
    try {
      await habilitarGrado(id);
      setDeshabilitados((prev) => prev.filter((g) => g.id !== id));
      setErrorDeshab("");
      await cargar();
    } catch (error: any) {
      setErrorDeshab(error.message);
    }
  }
  useEffect(() => {
    cargar();
  }, []);

  // Cambio: las secciones U pertenecen al flujo de revision/pendientes, no a Grados.
  const gradosVisibles = grados.filter((grado) => grado.seccion !== "U");

  return (
    <section>
      {/* ===== TOOLBAR MEJORADA ===== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
          pb: 2,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Gestión de Grados
        </Typography>

        <Link to={"template"} style={{ textDecoration: "none" }}>
          <ButtonMUI
            size="medium"
            variant="outlined"
            startIcon={<AssignmentIcon />}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Plantillas
          </ButtonMUI>
        </Link>
        <ButtonMUI
          size="medium"
          variant="outlined"
          color="warning"
          startIcon={<VisibilityOffIcon />}
          onClick={() => {
            setErrorDeshab("");
            cargarDeshabilitados();
            setshowModal("deshabilitados");
          }}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 500 }}
        >
          Ver deshabilitados
        </ButtonMUI>
        <PromoverEstudiantesBtn />

        <ButtonMUI
          variant="contained"
          size="medium"
          onClick={() => setshowModal("agregar")}
          startIcon={<SchoolIcon />}
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
          + Agregar grado
        </ButtonMUI>
      </Box>

      {/* ===== MODAL AGREGAR ===== */}
      <OptionsModal
        open={showModal === "agregar"}
        onClose={() => setshowModal(null)}
        width={"auto"}
        title="Agregar nuevo grado"
        wide={true}
        content={
          <Box sx={{ p: 4, pt: 2, maxWidth: 500, mx: "auto" }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 4,
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              Define el año académico y la sección para habilitar el registro de
              estudiantes y asignaturas en este nivel.
            </Typography>

            <FormularioModal
              campos={["Año", "Seccion"]}
              mode="grado"
              onSuccess={(nuevoGrado) => {
                setshowModal(null);
                cargar();
                // Cambio: solo actualiza optimista si el modal retorna un grado valido.
                if (esGrado(nuevoGrado)) setGrados([...grados, nuevoGrado]);
              }}
              id_to_rel={0}
            />
          </Box>
        }
      />

      <OptionsModal
        open={showModal === "deshabilitados"}
        onClose={() => setshowModal(null)}
        title="Grados deshabilitados"
        content={
          <Box sx={{ p: 3, minWidth: 320 }}>
            {deshabilitados.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center">
                No hay grados deshabilitados
              </Typography>
            ) : (
              deshabilitados.map((g) => (
                <Box
                  key={g.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography>
                    <strong>{g.anio}</strong> - Sección {g.seccion.toUpperCase()}
                  </Typography>
                  <IconButton
                    color="primary"
                    title="Habilitar"
                    onClick={() => handleHabilitar(g.id)}
                  >
                    <RestoreIcon />
                  </IconButton>
                </Box>
              ))
            )}
            {errorDeshab && (
              <div style={{ color: "red", marginTop: 10 }}>{errorDeshab}</div>
            )}
          </Box>
        }
      />

      <AcademicProcess mode="finalizacion" hideTitle allowPeriodCreation refreshKey={refreshKey}>
      {/* ===== CONTADOR DE GRADOS ===== */}
      <Box
        sx={{
          mt: 3,
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: alpha("#2196F3", 0.08),
          px: 2,
          py: 1,
          borderRadius: 2,
          width: "fit-content",
        }}
      >
        <GroupsIcon fontSize="small" color="primary" />
        <Typography variant="body2" color="text.secondary">
          Total de grados: <strong>{gradosVisibles.length}</strong>
        </Typography>
      </Box>

      {/* ===== GRID DE GRADOS MEJORADA ===== */}
      {gradosVisibles.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 12,
            px: 2,
            bgcolor: alpha("#000", 0.02),
            borderRadius: 3,
          }}
        >
          <SchoolIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay grados registrados
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comienza agregando tu primer grado
          </Typography>
          <ButtonMUI
            variant="contained"
            onClick={() => setshowModal("agregar")}
            startIcon={<SchoolIcon />}
          >
            Agregar grado
          </ButtonMUI>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 2.5,
          }}
        >
          {gradosVisibles.map((elemento, index) => (
            <React.Fragment key={elemento.id}>
              <Link
                to={`grado?anio=${elemento.anio}&seccion=${elemento.seccion}&id=${elemento.id}`}
                style={{ textDecoration: "none" }}
              >
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor:
                      selectedCard === index ? "primary.main" : "divider",
                    transition: "all 0.25s ease",
                    position: "relative",

                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedCard(index)}
                    sx={{ height: "100%" }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.2,
                        py: 3,
                      }}
                    >
                      {/* AÑO */}
                      <Typography
                        variant="h2"
                        fontWeight="bold"
                        color="primary"
                        lineHeight={1}
                      >
                        {elemento.anio}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{ opacity: 0.6, letterSpacing: 1 }}
                      >
                        AÑO
                      </Typography>

                      {/* SECCIÓN MEJORADA 🔥 */}
                      <Box
                        sx={{
                          mt: 1,
                          width: "100%",
                          bgcolor: "primary.main",
                          color: "white",
                          borderRadius: 2,
                          py: 0.8,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontWeight: "bold",
                          fontSize: "14px",
                          boxShadow: 2,
                        }}
                      >
                        Sección {elemento.seccion.toUpperCase()}
                      </Box>

                      {/* BOTÓN ELIMINAR 🔥 */}
                                       {/* BOTONES: DESHABILITAR + ELIMINAR 🔥 */}
                      <Box mt={1.2} sx={{ display: "flex", gap: 1.5 }}>
                        {/* Cambio: botón nuevo de deshabilitar */}
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setErrorMsg("");
                            setshowModal(`deshabilitar-${elemento.id}`);
                          }}
                        >
                          <ButtonMUI
                            size="small"
                            title="Deshabilitar grado"
                            sx={{
                              minWidth: 0,
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              backgroundColor: "#ed6c02",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "#e65100",
                                transform: "scale(1.1)",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            <BlockIcon fontSize="small" />
                          </ButtonMUI>
                        </Box>

                        {/* Botón eliminar original (sin cambios) */}
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setErrorMsg("");
                            setshowModal(elemento.id);
                          }}
                        >
                          <ButtonMUI
                            size="small"
                            sx={{
                              minWidth: 0,
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              backgroundColor: "#d32f2f",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "#b71c1c",
                                transform: "scale(1.1)",
                              },
                              transition: "all 0.2s",
                            }}
                          >
                            <Trash />
                          </ButtonMUI>
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Link>

              {/* MODAL */}
              <OptionsModal
                title="Eliminar Grado"
                open={showModal === elemento.id}
                onClose={() => setshowModal(null)}
                content={
                  <div style={{ margin: "20px", textAlign: "center" }}>
                    ¿Eliminar el grado{" "}
                    <strong>
                      {elemento.anio} - {elemento.seccion.toUpperCase()}
                    </strong>
                    ?
                    {errorMsg && (
                      <div style={{ color: "red", marginTop: 10 }}>
                        {errorMsg}
                      </div>
                    )}
                  </div>
                }
                optionalBtn={
                  <Button
                    variant="danger"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      try {
                        await eliminarGrado(elemento.id);
                        setGrados(grados.filter((g) => g.id !== elemento.id));
                        setRefreshKey((k) => k + 1);
                        setshowModal(null);
                        setErrorMsg("");
                      } catch (error: any) {
                        setErrorMsg(error.message);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                }
              />
                            {/* Cambio: modal deshabilitar */}
              <OptionsModal
                title="Deshabilitar Grado"
                open={showModal === `deshabilitar-${elemento.id}`}
                onClose={() => setshowModal(null)}
                content={
                  <div style={{ margin: "20px", textAlign: "center" }}>
                    ¿Deshabilitar el grado{" "}
                    <strong>
                      {elemento.anio} - {elemento.seccion.toUpperCase()}
                    </strong>
                    ?
                    <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
                      El historial académico se conserva. Podrá habilitarlo de
                      nuevo desde "Ver deshabilitados".
                    </div>
                    {errorMsg && (
                      <div style={{ color: "red", marginTop: 10 }}>{errorMsg}</div>
                    )}
                  </div>
                }
                optionalBtn={
                  <Button
                    variant="warning"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      try {
                        await deshabilitarGrado(elemento.id);
                        setGrados(grados.filter((g) => g.id !== elemento.id));
                        setRefreshKey((k) => k + 1);
                        setshowModal(null);
                        setErrorMsg("");
                      } catch (error: any) {
                        setErrorMsg(error.message);
                      }
                    }}
                  >
                    Deshabilitar
                  </Button>
                }
              />
            </React.Fragment>
          ))}
        </Box>
      )}

         </AcademicProcess>
    </section>
  );
}
//
export function ProfesoresList() {
  const [errorMsg, setErrorMsg] = useState("");

  const [profesores, setProfesores] = useState<Profesores[]>([]);
  const [showModal, setshowModal] = useState<number | null | string>(null);
  const [selectedCard, setSelectedCard] = React.useState(0);

  async function cargar() {
    const data = await obtenerProfesores();
    setProfesores(data);
  }
  useEffect(() => {
    cargar();
  }, []);

  console.log(profesores);
  return (
    <section>
      {/* ===== TOOLBAR ===== */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
          pb: 2,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Gestión de Profesores
        </Typography>

        <ButtonMUI
          variant="contained"
          size="medium"
          onClick={() => setshowModal("agregar")}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 500,
            boxShadow: 2,
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: 4,
            },
          }}
        >
          + Agregar profesor
        </ButtonMUI>
      </Box>

      {/* ===== MODAL AGREGAR ===== */}
      <OptionsModal
        open={showModal === "agregar"}
        onClose={() => setshowModal(null)}
        title="Agregar nuevo profesor"
        wide={true}
        content={
          <Box sx={{ p: 4, pt: 2, maxWidth: 600, mx: "auto" }}>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 4,
                lineHeight: 1.6,
                textAlign: "center",
              }}
            >
              Registra los datos del profesor para asignarlo a grados y
              asignaturas dentro del sistema.
            </Typography>

            <FormularioModal
              campos={[
                "Nombre",
                "Apellido",
                "Cedula",
                "Telefono",
                "Correo",
                "Direccion",
              ]}
              mode="profesor"
              onSuccess={() => {
                setshowModal(null);
                cargar();
              }}
              id_to_rel={0}
            />
          </Box>
        }
      />

      {/* ===== CONTADOR ===== */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "rgba(33,150,243,0.08)",
          px: 2,
          py: 1,
          borderRadius: 2,
          width: "fit-content",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Total de profesores: <strong>{profesores.length}</strong>
        </Typography>
      </Box>

      {/* ===== EMPTY STATE ===== */}
      {profesores.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 12,
            px: 2,
            bgcolor: "rgba(0,0,0,0.02)",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay profesores registrados
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Comienza agregando tu primer profesor
          </Typography>

          <ButtonMUI
            variant="contained"
            onClick={() => setshowModal("agregar")}
          >
            Agregar profesor
          </ButtonMUI>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 2.5,
          }}
        >
          {profesores.map((elemento, index) => (
            <React.Fragment key={elemento.id}>
              <Link
                to={`profesores?id_profesor=${elemento.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 2.5,
                    border: "1px solid",
                    borderColor:
                      selectedCard === index ? "primary.main" : "divider",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: 4,
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => setSelectedCard(index)}
                    sx={{ height: "100%" }}
                  >
                    <CardContent
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.2,
                        py: 3,
                        textAlign: "center",
                      }}
                    >
                      {/* NOMBRE */}
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ lineHeight: 1.2 }}
                      >
                        {elemento.nombre} {elemento.apellido}
                      </Typography>

                      {/* CÉDULA */}
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        C.I: {elemento.cedula}
                      </Typography>

                      {/* BOTÓN ELIMINAR */}
                      <Box
                        mt={1.5}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setshowModal(elemento.id);
                        }}
                      >
                        <ButtonMUI
                          size="small"
                          sx={{
                            minWidth: 0,
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            backgroundColor: "#d32f2f",
                            color: "white",
                            "&:hover": {
                              backgroundColor: "#b71c1c",
                              transform: "scale(1.1)",
                            },
                            transition: "all 0.2s",
                          }}
                        >
                          <Trash />
                        </ButtonMUI>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Link>

              {/* MODAL ELIMINAR */}
              <OptionsModal
                title="Eliminar Profesor"
                open={showModal === elemento.id}
                onClose={() => setshowModal(null)}
                content={
                  <div style={{ margin: "20px", textAlign: "center" }}>
                    ¿Eliminar al profesor{" "}
                    <strong>
                      {elemento.nombre} {elemento.apellido}
                    </strong>
                    ?
                    {errorMsg && (
                      <div style={{ color: "red", marginTop: 10 }}>
                        {errorMsg}
                      </div>
                    )}
                  </div>
                }
                optionalBtn={
                  <Button
                    variant="danger"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault();

                      try {
                        await eliminarProfesor(elemento.id);

                        setProfesores(
                          profesores.filter((p) => p.id !== elemento.id),
                        );

                        setshowModal(null);
                        setErrorMsg("");
                      } catch (error: any) {
                        // Cambio: muestra errores de eliminacion igual que Grados.
                        setErrorMsg(error.message);
                      }
                    }}
                  >
                    Eliminar
                  </Button>
                }
              />
            </React.Fragment>
          ))}
        </Box>
      )}
    </section>
  );
}
//
//
export function AsignaturasList() {
  return <Asignaturas />;
}

export default function ListasManejador({ mode }: { mode: ReactNode }) {
  return (
    <Routes>
      <Route path="/template" element={<GradosTemplate />}></Route>
      <Route path="/template/:anio" element={<TemplateAnio />} />
      <Route path="/" element={mode}></Route>
      <Route path="grado" element={<Grado />}></Route>
      <Route path="profesores" element={<Profesor />}></Route>
      <Route path="asignatura" element={<Asignaturas />}></Route>
    </Routes>
  );
}
