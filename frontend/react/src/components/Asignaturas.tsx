import { useEffect, useState } from "react";

import {
  eliminar_rel_grado_asignatura,
  obtenerAsignatura,
  obtenerRelacionesPorAnio,
  rel_grado_asignatura,
} from "../api/grados.ts";
import estilos from "../styles/grados.module.css";

import { SortableTable } from "./ui/Table";
import { FormularioModal } from "./FormularioModal.tsx";
import { EliminarEstudiante } from "./svg.tsx";

import { AlertDemo } from "./Alert.tsx";
import type {
  Profesores,
  relacion_asignatura_profesor,
} from "@/interfaces/interface.ts";

import {
  eliminar_profesor_asignatura_rel,
  obtenerProfesores,
} from "@/api/profesores.ts";
import ButtonMUI from "@mui/material/Button";

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";

import Typography from "@mui/material/Typography";
import { OptionsModal } from "./ui/BasicModal.tsx";
import Box from "@mui/material/Box";

interface RelacionGradoAsignatura {
  relacion_asignatura_profesor_id: number | null;
  anio: number;
  seccion: string;
  asignatura: string | null;
  profesor_asignado: string | null;
  relacion_id: number | null;
}

type AsignaturaBasica = {
  id: number;
  nombre: string;
};

export function Asignaturas() {
  const [asignaturaPorAnio, setAsignaturasPorAnio] = useState<
    RelacionGradoAsignatura[]
  >([]);
  const [showForm, setShowForm] = useState(false);
  const [itemEliminarAsignatura, setItemEliminarAsignatura] =
    useState<RelacionGradoAsignatura | null>(null);
  const [buscarAsignatura, setBuscarAsignatura] = useState(false);
  const [currentAnio, setCurrentAnio] = useState<number>();
  // Cambio: evita inferencia never[] al cargar asignaturas desde la API.
  const [asignaturas, setAsignaturas] = useState<AsignaturaBasica[]>([]);
  const [showAlert, setShowAlert] = useState<
    "" | "agregar" | "eliminar" | "actualizar"
  >("");
  const [itemAsignarProfesor, setItemAsignarProfesor] =
    useState<RelacionGradoAsignatura | null>(null);

  const [itemEliminarProfesor, setItemEliminarProfesor] =
    useState<RelacionGradoAsignatura | null>(null);

  const [profesoresList, setProfesoresList] = useState<Profesores[]>([]);
  const [asignaturasDelAnio, setAsignaturasDelAnio] = useState<string[]>([]);

  async function obtenerAsignaturasAnioProfesor() {
    const result = await rel_grado_asignatura();
    setAsignaturasPorAnio(result);
    const resultAsignaturas = await obtenerAsignatura();
    setAsignaturas(resultAsignaturas);
    const resultProfesores = await obtenerProfesores();
    const profesoresConCapacidades = await Promise.all(
      resultProfesores.map(async (prof: Profesores) => {
        const res = await fetch(
          `http://localhost:1234/profesores/byid/${prof.id}`,
        );
        const data = await res.json();
        return {
          ...prof,
          asignaturas_capaces: data.asignaturas_capaces || [],
        };
      }),
    );
    setProfesoresList(profesoresConCapacidades);
  }
  console.log(profesoresList);
  async function obtenerAsignaturasDelAnio(anio: number) {
    const relaciones = await obtenerRelacionesPorAnio(anio);
    // Extraer solo los nombres de asignaturas que ya tiene
    const asignaturasExistentes = relaciones.map((rel: any) => rel.asignatura);
    setAsignaturasDelAnio(asignaturasExistentes);
  }

  useEffect(() => {
    obtenerAsignaturasAnioProfesor();
  }, []);

  const tablasAgrupadas: Record<string, RelacionGradoAsignatura[]> = {};

  // Creamos las secciones aunque no tengan asignaturas
  asignaturaPorAnio.forEach((item) => {
    const key = `${item.anio} ${item.seccion.toUpperCase()}`;
    if (!tablasAgrupadas[key]) {
      tablasAgrupadas[key] = [];
    }
    tablasAgrupadas[key].push(item);
  });

  const columnas = [
    { label: "Asignatura", key: "asignatura", sortable: true },
    { label: "Profesor asignado", key: "profesor_asignado", sortable: true },
    { label: "Opciones", key: "relacion_id" },
  ] satisfies {
    label: string;
    key: keyof RelacionGradoAsignatura;
    sortable?: boolean;
  }[];

  return (
    <>
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
          Gestión de asignarutas por año y sección
        </Typography>
      </Box>
      <div id={estilos.container_asignaturas}>
        {Object.entries(tablasAgrupadas).map(([anioSeccion, asignatura]) => {
          const asignaturasValidas = asignatura.filter(
            (a) => a.relacion_id !== null,
          );

          return (
            //
            ///
            //
            ///
            <Card sx={{ width: "100%" }}>
              <CardContent>
                <Typography variant="h5" component="div" align="center">
                  {anioSeccion}
                </Typography>

                {asignaturasValidas.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    Sin asignaturas en esta sección
                  </div>
                ) : (
                  <div className={estilos.table_container}>
                    <SortableTable
                      columns={columnas}
                      rows={asignaturasValidas.map((item) => ({
                        ...item,
                        asignatura: (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              gap: "6px",
                            }}
                          >
                            <ButtonMUI
                              onClick={() => setItemEliminarAsignatura(item)}
                            >
                              <EliminarEstudiante />
                            </ButtonMUI>
                            {item.asignatura}
                          </div>
                        ),
                        relacion_id: (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                            className={estilos.table_actions}
                          >
                            {item.profesor_asignado === "Sin Asignar" ? (
                              <ButtonMUI
                                variant="outlined"
                                color="success"
                                style={{ fontSize: "11px" }}
                                onClick={() => {
                                  setItemAsignarProfesor(item);
                                }}
                              >
                                Asignar
                              </ButtonMUI>
                            ) : (
                              <ButtonMUI
                                variant="outlined"
                                color="error"
                                onClick={() => {
                                  setItemEliminarProfesor(item);
                                }}
                              >
                                <EliminarEstudiante />
                              </ButtonMUI>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  </div>
                )}
              </CardContent>

              <CardActions style={{ justifyContent: "center" }}>
                <ButtonMUI
                  variant="outlined"
                  onClick={() => {
                    setShowForm(true);
                    // Extraer año del primer elemento si existe, si no del string anioSeccion
                    const anio =
                      asignatura.length > 0
                        ? asignatura[0].anio
                        : parseInt(anioSeccion.split(" ")[0]);
                    setCurrentAnio(anio);
                  }}
                >
                  Crear Asignatura
                </ButtonMUI>
                <ButtonMUI
                  variant="outlined"
                  onClick={() => {
                    setBuscarAsignatura(true);
                    const anio =
                      asignatura.length > 0
                        ? asignatura[0].anio
                        : parseInt(anioSeccion.split(" ")[0]);
                    setCurrentAnio(anio);
                    obtenerAsignaturasDelAnio(anio);
                  }}
                >
                  Buscar Asignatura
                </ButtonMUI>
              </CardActions>
            </Card>
          );
        })}
      </div>
      <OptionsModal
        open={itemEliminarAsignatura !== null}
        onClose={() => setItemEliminarAsignatura(null)}
        title="Confirmar Eliminación de Asignatura"
        content={
          <div style={{ padding: "10px" }}>
            Al aceptar estaría quitando{" "}
            <strong>{itemEliminarAsignatura?.asignatura}</strong> de todos los{" "}
            <strong>{itemEliminarAsignatura?.anio}° año</strong> (todas las
            secciones)
          </div>
        }
        optionalBtn={
          <ButtonMUI
            variant="contained"
            color="error"
            onClick={async () => {
              if (!itemEliminarAsignatura) return;
              await eliminar_rel_grado_asignatura(
                itemEliminarAsignatura.anio,
                itemEliminarAsignatura.asignatura!,
              );
              await obtenerAsignaturasAnioProfesor();
              setItemEliminarAsignatura(null);
              setShowAlert("eliminar");
            }}
          >
            Aceptar
          </ButtonMUI>
        }
      />
      <OptionsModal
        open={itemEliminarProfesor !== null}
        onClose={() => setItemEliminarProfesor(null)}
        title={`Eliminar Profesor Asignado de ${itemEliminarProfesor?.asignatura}`}
        content={
          <div id={estilos.box_asignaturas}>
            <div style={{ padding: "10px" }}>
              Al aceptar estaría dejando sin profesor esta asignatura
            </div>
          </div>
        }
        optionalBtn={
          <ButtonMUI
            variant="contained"
            color="error"
            onClick={async () => {
              if (!itemEliminarProfesor) return;

              await eliminar_profesor_asignatura_rel(
                itemEliminarProfesor.relacion_asignatura_profesor_id!,
              );

              setAsignaturasPorAnio((prev) =>
                prev.map((a) =>
                  a.relacion_asignatura_profesor_id ===
                  itemEliminarProfesor.relacion_asignatura_profesor_id
                    ? {
                        ...a,
                        profesor_asignado: "Sin Asignar",
                        relacion_asignatura_profesor_id: null,
                      }
                    : a,
                ),
              );

              setItemEliminarProfesor(null);
              setShowAlert("eliminar");
            }}
          >
            Aceptar
          </ButtonMUI>
        }
      />
      <OptionsModal
        title="Agregar Nueva Asignatura"
        open={showForm}
        onClose={() => setShowForm(false)}
        content={
          <div id={estilos.box_asignaturas}>
            <FormularioModal
              campos={["Nombre de la asignatura"]}
              onSuccess={async () => {
                setBuscarAsignatura(false);
                // Recargar los datos SIN refrescar la página
                await obtenerAsignaturasAnioProfesor();
                setShowAlert("agregar");
                setShowForm(false);
              }}
              id_to_rel={currentAnio!}
              mode="crear asignatura"
            />
          </div>
        }
      />
      <OptionsModal
        open={itemAsignarProfesor !== null}
        onClose={() => setItemAsignarProfesor(null)}
        title={`Asignar Profesor de ${itemAsignarProfesor?.asignatura ?? ""}`}
        content={
          <div id={estilos.box_asignaturas}>
            {itemAsignarProfesor && (
              <FormularioModal<Profesores, relacion_asignatura_profesor>
                campos={["Seleccionar Profesor"]}
                onSuccess={(data) => {
                  setItemAsignarProfesor(null);
                  setAsignaturasPorAnio((prev) =>
                    prev.map((a) =>
                      a.relacion_id === data.id_relacion_grado_asignatura
                        ? {
                            ...a,
                            profesor_asignado: `${data.nombre} ${data.apellido}`,
                            relacion_asignatura_profesor_id:
                              data.relacion_asignatura_profesor_id,
                          }
                        : a,
                    ),
                  );
                }}
                id_to_rel={itemAsignarProfesor.relacion_id!}
                dataScroll={profesoresList.filter((profesor) => {
                  // 👇 FILTRO: solo profesores que PUEDEN dar esta asignatura
                  const asignaturasCapaces = profesor.asignaturas_capaces || [];
                  return asignaturasCapaces.some(
                    (asig: any) =>
                      asig.nombre === itemAsignarProfesor?.asignatura,
                  );
                })}
                mode="buscar profesor"
              />
            )}
          </div>
        }
      />

      <OptionsModal
        title="Seleccionar Asignatura Existente"
        open={buscarAsignatura}
        onClose={() => setBuscarAsignatura(false)}
        content={
          <div id={estilos.box_asignaturas}>
            <FormularioModal
              campos={["Nombre de la asignatura"]}
              onSuccess={async () => {
                setBuscarAsignatura(false);
                // Recargar los datos SIN refrescar la página
                await obtenerAsignaturasAnioProfesor();
                setShowAlert("agregar");
              }}
              id_to_rel={currentAnio!}
              dataScroll={asignaturas.filter(
                (asig: any) => !asignaturasDelAnio.includes(asig.nombre),
              )}
              mode="buscar asignatura"
            />
          </div>
        }
      />
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
