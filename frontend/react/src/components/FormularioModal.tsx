import FormControl from "@mui/material/FormControl";
import { useForm } from "react-hook-form";
import { useState } from "react";
import ButtonMUI from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import estilo from "../styles/grados.module.css";
import { actualizarRepresentante } from "../api/representantes";
import {
  crearAsignatura,
  create_rel_asignatura_profesor,
  crearGrado,
  crearRelGradoAsignatura,
  obtenerAsignatura,
} from "@/api/grados.ts";
import React from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import {
  actualizarProfesorCompleto,
  crearProfesor,
  guardarAsignaturasProfesorTemplate,
  asignaturasParaProfesor,
} from "../api/profesores.ts";
import VirtualizedList from "./ui/VirtualizedList.tsx";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Chip from "@mui/material/Chip";
import {
  actualizarAdministrador,
  crearAdministrador,
} from "@/api/administradores.ts";
import EditLayout from "./Dato.tsx";

interface ItemBase {
  id: number;
  nombre: string;
  [key: string]: any;
}

interface FormularioProps<T extends ItemBase, R = unknown> {
  campos: string[];
  id_to_rel?: number;
  id_estudiante?: number;
  onSuccess: (data: R) => void;

  dataScroll?: T[];
  mode?:
    | "estudiante"
    | "profesor"
    | "editar profesor"
    | "administradores"
    | "editar administrador"
    | "grado"
    | "asignatura"
    | "crear asignatura"
    | "buscar asignatura"
    | "buscar profesor"
    | "editar representante"; // ← Añade esto
}

export function FormularioModal<T extends ItemBase, R = unknown>({
  campos,
  id_to_rel,
  onSuccess,
  id_estudiante,
  dataScroll,
  mode,
}: FormularioProps<T, R>) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, any>>();
  const data = dataScroll;
  const [errorMsg, setErrorMsg] = useState("");
  const [asignaturasDisponibles, setAsignaturasDisponibles] = React.useState<
    any[]
  >([]);
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] =
    React.useState<number[]>([]);

  React.useEffect(() => {
    if (mode === "profesor" || mode === "editar profesor") {
      obtenerAsignatura().then((data) => {
        if (Array.isArray(data)) {
          setAsignaturasDisponibles(data);
        } else {
          console.warn("Asignaturas no es array:", data);
          setAsignaturasDisponibles([]);
        }
      });
    }
  }, [mode]);

  //
  //

  // SEGUNDO: Cargar asignaturasSeleccionadas SOLO cuando ya tenemos disponibles
  React.useEffect(() => {
    if (
      mode === "editar profesor" &&
      id_to_rel &&
      asignaturasDisponibles.length > 0
    ) {
      asignaturasParaProfesor(id_to_rel).then((data) => {
        if (Array.isArray(data)) {
          const ids = data.map((a: any) => a.id_asignatura);

          setAsignaturasSeleccionadas(ids);
        }
      });
    }
  }, [mode, id_to_rel, asignaturasDisponibles.length]); // ← Dependencia añad
  //
  //

  const onSubmitOrPatch = async (data: Record<string, any>) => {
    setErrorMsg("");

    if (
      mode === "profesor" ||
      mode === "editar profesor" ||
      mode === "administradores" ||
      mode === "editar representante" ||
      mode === "editar administrador"
    ) {
      const datosFinales = {
        ...(data.nombre && { nombre: data.nombre }),
        ...(data.apellido && { apellido: data.apellido }),
        ...(data.cedula && { cedula: Number(data.cedula) }),
        ...(data.telefono && { telefono: data.telefono }),
        ...(data.correo && { correo: data.correo }),
        ...(data.direccion && { direccion: data.direccion }),
      };
      if (mode === "editar administrador") {
        try {
          if (!Object.keys(datosFinales).length) {
            setErrorMsg("Debes modificar al menos un campo");
            reset(); // 🔥 limpiar
            return;
          }

          await actualizarAdministrador(id_to_rel!, datosFinales);

          reset();
          setErrorMsg("");
          onSuccess(true as R);

          window.dispatchEvent(new Event("closeModal"));
        } catch (error: any) {
          setErrorMsg(error?.message || "Error al actualizar administrador");

          reset();
        }
      }

      if (mode === "profesor" || mode === "editar profesor") {
        if (mode === "profesor") {
          try {
            const nuevoProfesor = await crearProfesor(datosFinales);
            setErrorMsg("");

            await guardarAsignaturasProfesorTemplate(
              nuevoProfesor.profesor.id,
              asignaturasSeleccionadas,
            );

            reset();
            setAsignaturasSeleccionadas([]);
            setErrorMsg("");
            onSuccess(nuevoProfesor);
          } catch (err: any) {
            console.log(err);
            setErrorMsg(err.message || "Error de conexión");
            reset();
          }
        }
        if (mode === "editar profesor") {
          try {
            const datosCompletos = {
              ...datosFinales,
              asignaturasIds: asignaturasSeleccionadas,
            };

            await actualizarProfesorCompleto(id_to_rel!, datosCompletos);

            reset();
            onSuccess(true as R);

            window.dispatchEvent(new Event("closeModal"));
          } catch (err: any) {
            console.log(err);
            setErrorMsg(err.message || "Error de conexión");
            reset();
          }
        }
      }
      if (mode === "administradores") {
        try {
          const nuevoAdmin = await crearAdministrador(datosFinales);
          reset();
          setErrorMsg("");
          if (data.cedula === null) {
            delete data.cedula;
          }

          onSuccess(nuevoAdmin);
        } catch (error: any) {
          console.log(error);
          setErrorMsg(error?.message || "Error al crear administrador");
          reset();
        }
      }

      if (mode === "editar representante") {
        try {
          await actualizarRepresentante(id_to_rel!, datosFinales);

          reset();
          onSuccess(true as R);

          window.dispatchEvent(new Event("closeModal"));
        } catch (error: any) {
          console.log(error);
          setErrorMsg(error?.message || "Error actualizando representante");
          reset();
        }
      }
    } else if (mode === "grado") {
      try {
        const nuevoGrado = await crearGrado({
          anio: Number(data.año),
          seccion: data.seccion,
        });

        if (nuevoGrado?.Message) {
          setErrorMsg(nuevoGrado.Message);
          return;
        }

        reset();
        setErrorMsg("");
        onSuccess(nuevoGrado);
        window.dispatchEvent(new Event("closeModal"));
      } catch (error: any) {
        setErrorMsg(error.message || "Error al crear el grado");
        reset();
      }
    } else {
      try {
        const result = await crearAsignatura({
          asignatura: data["nombre de la asignatura"],
        });
        console.log(result);
        const nuevaRelacion = await crearRelGradoAsignatura({
          id_asignatura: result.id,
          anio: id_to_rel!,
        });
        reset();
        onSuccess(nuevaRelacion as R);
      } catch (error) {}
    }
  };

  // Función para obtener las validaciones según el modo y el campo
  const getFieldValidations = (elemento: string) => {
    const fieldName = elemento.toLowerCase();
    const isEdit = !!id_estudiante || !!id_to_rel;

    const baseValidations: any = {
      required: !isEdit ? "Este campo es obligatorio" : false,
    };

    // Validaciones específicas para cédula según el modo
    if (fieldName === "cedula") {
      if (mode === "profesor") {
        return {
          ...baseValidations,
          min: {
            value: 1000000,
            message: "La cédula debe ser mayor a 1,000,000",
          },
          max: {
            value: 30000000,
            message: "La cédula debe ser menor a 30,000,000",
          },
          pattern: {
            value: /^[0-9]+$/,
            message: "Solo se permiten números",
          },
        };
      } else if (mode === "administradores") {
        return {
          ...baseValidations,
          min: {
            value: 1000000,
            message: "La cédula debe ser mayor a 1,000,000",
          },
          max: {
            value: 30000000,
            message: "La cédula debe ser menor a 30,000,000",
          },
          pattern: {
            value: /^[0-9]+$/,
            message: "Solo se permiten números",
          },
        };
      }
      if (
        mode === "editar profesor" ||
        mode === "editar administrador" ||
        mode === "editar representante"
      ) {
        return {
          required: false,
          min: {
            value: 1000000,
            message: "La cédula debe ser mayor a 1,000,000",
          },
          max: {
            value: 30000000,
            message: "La cédula no puede superar 30,000,000",
          },
          pattern: { value: /^[0-9]+$/, message: "Solo se permiten números" },
        };
      }
    }

    // Validaciones para teléfono
    if (fieldName === "telefono") {
      return {
        ...baseValidations,
        minLength: {
          value: 11,
          message: "El teléfono debe tener 11 dígitos",
        },
        maxLength: {
          value: 11,
          message: "El teléfono debe tener 11 dígitos",
        },
        pattern: {
          value: /^[0-9]{11}$/,
          message: "Solo números, 11 dígitos sin espacios ni símbolos",
        },
      };
    }

    // Validaciones para correo
    if (fieldName === "correo") {
      return {
        ...baseValidations,
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: "Correo electrónico inválido",
        },
      };
    }

    // Validaciones para año (grado)
    if (fieldName === "año" && mode === "grado") {
      return {
        ...baseValidations,
        min: {
          value: 1,
          message: "El año debe ser entre 1 y 6",
        },
        max: {
          value: 6,
          message: "El año debe ser entre 1 y 6",
        },
      };
    }

    // Validaciones para sección
    if (fieldName === "seccion" && mode === "grado") {
      return {
        ...baseValidations,
        pattern: {
          value: /^[ABCDEabcde]$/,
          message: "Solo se permiten las letras A, B, C, D o E",
        },
        maxLength: {
          value: 1,
          message: "La sección debe ser una sola letra",
        },
      };
    }

    return baseValidations;
  };

  // Función para obtener los inputProps según el campo y modo
  const getInputProps = (elemento: string) => {
    const fieldName = elemento.toLowerCase();

    if (fieldName === "cedula") {
      if (mode === "profesor" || mode === "administradores") {
        return {
          inputMode: "numeric" as const,
          min: 1000000,
          max: 30000000,
          step: 1,
          maxLength: 8,
        };
      }

      if (
        mode === "editar profesor" ||
        mode === "editar administrador" ||
        mode === "editar representante"
      ) {
        return {
          inputMode: "numeric" as const,
          min: 1000000, // ✅ valor plano
          max: 30000000, // ✅ valor plano
          step: 1,
          maxLength: 8,
        };
      }
    }

    if (fieldName === "telefono") {
      return {
        inputMode: "numeric" as const,
        maxLength: 11,
        pattern: "[0-9]*",
      };
    }

    if (fieldName === "año" && mode === "grado") {
      return {
        inputMode: "numeric" as const,
        min: 1,
        max: 6,
        step: 1,
        pattern: "[0-9]*",
      };
    }

    if (fieldName === "seccion" && mode === "grado") {
      return {
        maxLength: 1,
      };
    }

    return undefined;
  };
  // 👇 JUSTO ANTES DEL return principal del componente
  if (
    mode === "editar profesor" ||
    mode === "editar representante" ||
    mode === "editar administrador"
  ) {
    return (
      <form onSubmit={handleSubmit(onSubmitOrPatch)}>
        <EditLayout
          title={
            mode === "editar profesor"
              ? "Actualizar profesor"
              : mode === "editar representante"
                ? "Actualizar representante"
                : "Actualizar administrador"
          }
          description="Solo completa los campos que deseas modificar"
          campos={campos}
          register={register}
          errors={errors}
          getValidations={getFieldValidations}
          datosActuales={{
            Nombre: dataScroll?.find((p) => p.id === id_to_rel)?.nombre,
            Apellido: dataScroll?.find((p) => p.id === id_to_rel)?.apellido,
            Cedula: dataScroll?.find((p) => p.id === id_to_rel)?.cedula,
            Correo: dataScroll?.find((p) => p.id === id_to_rel)?.correo,
            Telefono: dataScroll?.find((p) => p.id === id_to_rel)?.telefono,
            Direccion: dataScroll?.find((p) => p.id === id_to_rel)?.direccion,
          }}
        />
        {mode === "editar profesor" && (
          <FormControl sx={{ m: 1, width: "100%" }}>
            <InputLabel id="asignaturas-multiple-label">Asignaturas</InputLabel>

            <Select
              labelId="asignaturas-multiple-label"
              multiple
              value={asignaturasSeleccionadas}
              onChange={(event) => {
                const value = event.target.value;

                const nuevasSelecciones =
                  typeof value === "string"
                    ? value.split(",").map(Number)
                    : value;

                setAsignaturasSeleccionadas(nuevasSelecciones);
              }}
              input={<OutlinedInput label="Asignaturas" />}
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((id) => {
                    const asignatura = asignaturasDisponibles.find(
                      (a) => Number(a.id) === Number(id),
                    );
                    return <Chip key={id} label={asignatura?.nombre || "?"} />;
                  })}
                </Box>
              )}
            >
              {asignaturasDisponibles.map((asignatura) => (
                <MenuItem key={asignatura.id} value={asignatura.id}>
                  {asignatura.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Box mt={4} textAlign="center">
          <ButtonMUI
            variant="contained"
            color="success"
            type="submit"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 500,
            }}
          >
            Actualizar
          </ButtonMUI>
        </Box>

        {Object.keys(errors).length > 0 && (
          <Typography
            variant="caption"
            sx={{
              color: "error.main",
              textAlign: "center",
              display: "block",
              mt: 1,
              fontWeight: 500,
            }}
          >
            Corrige los campos marcados en rojo
          </Typography>
        )}
        {errorMsg && (
          <div style={{ color: "red", marginTop: 10, textAlign: "center" }}>
            {errorMsg}
          </div>
        )}
      </form>
    );
  }

  return (
    <>
      {mode !== "buscar asignatura" && mode !== "buscar profesor" && (
        <form onSubmit={handleSubmit(onSubmitOrPatch)}>
          <div className={estilo.grid_container}>
            {campos.map((elemento) => {
              const fieldName = elemento.toLowerCase();
              const fieldError = errors[fieldName];

              return (
                <div key={elemento} className={estilo.form_field}>
                  <Box sx={{ "& > :not(style)": { m: 1, width: "100%" } }}>
                    <TextField
                      label={elemento}
                      variant="outlined"
                      error={!!fieldError}
                      helperText={fieldError?.message as string}
                      type={fieldName === "año" ? "number" : "text"}
                      {...register(fieldName, getFieldValidations(elemento))}
                      slotProps={{
                        htmlInput: getInputProps(elemento),
                      }}
                      sx={{ width: "100%" }}
                    />
                  </Box>
                </div>
              );
            })}
          </div>
          {mode === "profesor" && (
            <FormControl sx={{ m: 1, width: "100%" }}>
              <InputLabel id="asignaturas-multiple-label">
                Asignaturas
              </InputLabel>

              <Select
                labelId="asignaturas-multiple-label"
                multiple
                value={asignaturasSeleccionadas}
                onChange={(event) => {
                  const value = event.target.value;
                  const nuevasSelecciones =
                    typeof value === "string"
                      ? value.split(",").map(Number)
                      : value;
                  console.log(
                    "📚 IDs de asignaturas seleccionadas:",
                    nuevasSelecciones,
                  );
                  const nombresAsignaturas = nuevasSelecciones.map((id) => {
                    const asignatura = asignaturasDisponibles.find(
                      (a) => Number(a.id) === Number(id),
                    );
                    return asignatura?.nombre;
                  });
                  console.log(
                    "📝 Nombres de asignaturas seleccionadas:",
                    nombresAsignaturas,
                  );

                  setAsignaturasSeleccionadas(nuevasSelecciones);
                }}
                input={<OutlinedInput label="Asignaturas" />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((id) => {
                      const asignatura = asignaturasDisponibles.find(
                        (a) => Number(a.id) === Number(id),
                      );
                      return (
                        <Chip key={id} label={asignatura?.nombre || "?"} />
                      );
                    })}
                  </Box>
                )}
              >
                {Array.isArray(asignaturasDisponibles) &&
                  asignaturasDisponibles.map((asignatura) => (
                    <MenuItem key={asignatura.id} value={asignatura.id}>
                      {asignatura.nombre}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              width: "100%",
              px: 1,
              mt: 2,
            }}
          >
            <ButtonMUI
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 500,
                py: 1,
              }}
            >
              Registrar
            </ButtonMUI>

            {Object.keys(errors).length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  color: "error.main",
                  textAlign: "center",
                  fontWeight: 500,
                }}
              >
                Corrige los campos marcados en rojo
              </Typography>
            )}
          </Box>
        </form>
      )}

      {dataScroll && (
        <>
          <VirtualizedList
            items={data || []}
            height={220}
            width={360}
            itemHeight={46}
            getItemText={(elemento) =>
              mode === "buscar profesor"
                ? `${elemento.nombre} ${elemento.apellido}`
                : elemento.nombre
            }
            onItemClick={async (elemento) => {
              if (mode === "buscar asignatura") {
                const nuevaRelacion = await crearRelGradoAsignatura({
                  anio: id_to_rel!,
                  id_asignatura: elemento.id,
                });
                onSuccess(nuevaRelacion); // Pasa la nueva relación al onSuccess
              }

              if (mode === "buscar profesor") {
                try {
                  // Espera la respuesta del backend
                  const nuevaRelacion = await create_rel_asignatura_profesor({
                    id_rel_grado_asignatura: id_to_rel!,
                    id_profesor: elemento.id,
                  });

                  // Pasa la respuesta completa a onSuccess
                  onSuccess(nuevaRelacion);
                } catch (error) {
                  console.log(error);
                  reset();
                }
              }
            }}
            overscanCount={5}
          />
          <div id={estilo.scroll_area_box}></div>
        </>
      )}
      {errorMsg && (
        <div style={{ color: "red", marginTop: 10, textAlign: "center" }}>
          {errorMsg}
        </div>
      )}
    </>
  );
}
