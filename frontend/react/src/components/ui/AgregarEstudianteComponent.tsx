import * as React from "react";
import Box from "@mui/material/Box";
import ButtonMUI from "@mui/material/Button";
import Button from "react-bootstrap/Button";
import Typography from "@mui/material/Typography";

import Modal from "@mui/material/Modal";
import { useForm, Controller } from "react-hook-form";
import {
  actualizarEstudiante,
  crear_estudiante,
  crear_estudiante_rel,
  hardDeleteEstudiante,
} from "../../api/estudiantes.ts";
import estilo from "../../styles/grados.module.css";
import TextField from "@mui/material/TextField";
import {
  crear_rel_representante_estudiante,
  crearRepresentantes,
  hardDeleteRepresentante,
} from "@/api/representantes.ts";
import RepresentanteAutocomplete from "../RepresentanteAutocomplete.tsx";

//
//
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90vw",
  maxWidth: 1100,
  maxHeight: "90vh",
  overflowY: "auto",

  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

//
//
interface BasicModalProps {
  btnText?: string | React.ReactNode;
  title?: string;
  id_estudiante?: number;
  content?: React.ReactNode;
  nombre?: string;
  apellido?: string;
  cedula?: number;
  correo?: string;
  telefono?: string;
  lugar_nacimiento?: string;
  entidad_federal?: string;
  onSuccess?: () => void;
  id_grado: number;
  buttonProps?: React.ComponentProps<typeof ButtonMUI>;
}
//
interface FormProps {
  id_to_rel: number;
  id_estudiante?: number;
  onSuccess: () => void;
  nombre?: string;
  apellido?: string;
  cedula?: number;
  correo?: string;
  telefono?: string;
  lugar_nacimiento?: string;
  entidad_federal?: string;
}
//
const estudiantesCampos = [
  { label: "Nombre", name: "nombre" },
  { label: "Apellido", name: "apellido" },
  { label: "Cedula", name: "cedula" },
  { label: "Telefono", name: "telefono" },
  { label: "Correo", name: "correo" },
  // Cambio: campos oficiales requeridos por la planilla 31060.
  { label: "Lugar de nacimiento", name: "lugar_nacimiento" },
  { label: "Entidad Federal", name: "entidad_federal" },
];

const representanteCampos = [
  "Nombre",
  "Apellido",
  "Cedula",
  "Direccion",
  "Parentesco",
  "Telefono",
  "Correo",
];
//
//

function Dato({ label, value }: { label: string; value?: string | number }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ letterSpacing: 0.4 }}
      >
        {label}
      </Typography>

      <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.4 }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

export function Form({
  id_to_rel,
  id_estudiante,
  onSuccess,
  nombre,
  apellido,
  cedula,

  correo,
  telefono,
  lugar_nacimiento,
  entidad_federal,
}: FormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<Record<string, any>>({
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  //
  const [representanteExistente, setRepresentanteExistente] =
    React.useState(null);

  const [showError, setShowError] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState(""); // 👈 NUEVO
  const [segundoRepresentante, setSegundoRepresentante] = React.useState(false);
  //
  //Funcion
  const onSubmitOrPatch = async (data: Record<string, any>) => {
    setShowError(false);
    setErrorMsg("");
    console.log(id_to_rel);
    console.log(data);

    console.log("Grado");
    const estudianteObject = {
      ...(data.estudiante?.nombre && { nombre: data.estudiante.nombre }),
      ...(data.estudiante?.apellido && { apellido: data.estudiante.apellido }),
      ...(data.estudiante?.cedula && {
        cedula: Number(data.estudiante.cedula),
      }),
      ...(data.estudiante?.telefono && {
        telefono: data.estudiante.telefono,
      }),
      ...(data.estudiante?.correo && {
        correo: data.estudiante.correo,
      }),
      ...(data.estudiante?.lugar_nacimiento && {
        lugar_nacimiento: data.estudiante.lugar_nacimiento,
      }),
      ...(data.estudiante?.entidad_federal && {
        entidad_federal: data.estudiante.entidad_federal,
      }),
    };
    const representanteObject1 = {
      ...(data.representante1?.nombre && {
        nombre: data.representante1.nombre,
      }),
      ...(data.representante1?.apellido && {
        apellido: data.representante1.apellido,
      }),
      ...(data.representante1?.cedula && {
        cedula: Number(data.representante1.cedula),
      }),
      ...(data.representante1?.correo && {
        correo: data.representante1.correo,
      }),
      ...(data.representante1?.telefono && {
        telefono: data.representante1.telefono,
      }),
      ...(data.representante1?.direccion && {
        direccion: data.representante1.direccion,
      }),
      //  ...(data.representante1?.parentesco && {
      //    parentesco: data.representante1.parentesco,
      // }),
    };
    const representanteObject2 = {
      ...(data.representante2?.nombre && {
        nombre: data.representante2.nombre,
      }),
      ...(data.representante2?.apellido && {
        apellido: data.representante2.apellido,
      }),
      ...(data.representante2?.cedula && {
        cedula: Number(data.representante2.cedula),
      }),
      ...(data.representante2?.correo && {
        correo: data.representante2.correo,
      }),
      ...(data.representante2?.telefono && {
        telefono: data.representante2.telefono,
      }),
      ...(data.representante2?.direccion && {
        direccion: data.representante2.direccion,
      }),
      //   ...(data.representante2?.parentesco && {
      //  parentesco: data.representante2.parentesco,
      //}),
    };

    console.log(estudianteObject);
    console.log(representanteObject1);
    console.log(representanteObject2);
    if (id_estudiante) {
      // Modo editar - igual
      if (!Object.keys(estudianteObject).length) {
        setErrorMsg("Debes modificar al menos un campo para actualizar");
        setShowError(true);
        return;
      }
      try {
        const update = await actualizarEstudiante(
          id_estudiante!,
          estudianteObject,
        );
        console.log("updateeee", update);
        reset();
        onSuccess();
      } catch (error) {
        console.log(error);
        // Cambio: TypeScript trata catch como unknown.
        setErrorMsg(
          error instanceof Error
            ? error.message
            : "Error al actualizar estudiante",
        );
        reset();
        setShowError(true);
      }
    } else {
      // MODO CREAR - TRANSACCIÓN EN EL FRONTEND
      try {
        // 1. Crear estudiante
        const nuevoEstudiante = await crear_estudiante(estudianteObject);

        // 2. Preparar array de representantes
        const representantes = [];

        // Representante 1
        if (Object.keys(representanteObject1).length > 0) {
          representantes.push({
            data: representanteObject1,
            parentesco: data.representante1?.parentesco,
          });
        }

        // Representante 2 (si existe)
        if (
          segundoRepresentante &&
          Object.keys(representanteObject2).length > 0
        ) {
          representantes.push({
            data: representanteObject2,
            parentesco: data.representante2?.parentesco,
          });
        }

        // 3. Crear TODOS los representantes
        const representantesCreados = [];
        try {
          for (const rep of representantes) {
            let representanteFinal;

            if (representanteExistente) {
              representanteFinal = representanteExistente;
            } else {
              representanteFinal = await crearRepresentantes(rep.data);
            }

            representantesCreados.push({
              ...representanteFinal,
              parentesco: rep.parentesco,
            });
          }
        } catch (repError) {
          // Si falla algún representante, ELIMINAR el estudiante creado (ROLLBACK)
          await hardDeleteEstudiante(nuevoEstudiante.id);
          reset();
          throw repError; // Relanzar el error
        }

        // 4. Crear TODAS las relaciones
        try {
          for (const rep of representantesCreados) {
            await crear_rel_representante_estudiante({
              id_estudiante: nuevoEstudiante.id,
              id_representante: rep.id,
              parentesco: rep.parentesco,
            });
          }
        } catch (relError) {
          console.log("❌ Error en representante:", relError);
          console.log("❌ ID del estudiante:", nuevoEstudiante?.id); // 👈 ¿QUÉ MUESTRA?
          await hardDeleteEstudiante(nuevoEstudiante.id);
          for (const rep of representantesCreados) {
            await hardDeleteRepresentante(rep.id);
          }
          reset();
          throw relError;
        }

        // 5. Crear relación con grado
        try {
          await crear_estudiante_rel({
            id_estudiante: nuevoEstudiante.id,
            id_grado: Number(id_to_rel),
          });
        } catch (gradoError) {
          // Si falla la relación con grado, eliminar todo
          await hardDeleteEstudiante(nuevoEstudiante.id);
          for (const rep of representantesCreados) {
            await hardDeleteRepresentante(rep.id);
          }
          reset();
          throw gradoError;
        }

        // ¡TODO OK!
        reset();
        onSuccess();
      } catch (error: any) {
        console.log(error);

        setErrorMsg(error.message || "Error al crear el registro");
        setShowError(true);
        reset();
      }
    }
  };

  const onInvalid = () => {
    setShowError(true);
    setErrorMsg(
      id_estudiante
        ? "Corrige los campos marcados en rojo"
        : "Se necesitan todos los campos para registrar",
    );
  };

  if (id_estudiante !== undefined) {
    return (
      <form noValidate onSubmit={handleSubmit(onSubmitOrPatch, onInvalid)}>
        {/* CONTENEDOR PRINCIPAL */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "2.2fr 1.3fr",
            },
            gap: 4,
            maxWidth: 880,
            mx: "auto",
            alignItems: "flex-start",
          }}
        >
          {/* ================= FORMULARIO ================= */}
          <Box>
            <Typography variant="h6" mb={1}>
              Actualizar campos
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Solo completa los campos que deseas modificar
            </Typography>

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },
                gap: 2,
              }}
            >
              {estudiantesCampos.map((elemento) => {
                const fieldName = elemento.name;
                const fieldError = (errors.estudiante as any)?.[fieldName];
                return (
                  <TextField
                    key={elemento.name}
                    size="small"
                    label={elemento.label}
                    error={!!fieldError}
                    helperText={fieldError?.message as string}
                    inputProps={
                      fieldName === "telefono" || fieldName === "cedula"
                        ? { inputMode: "numeric" }
                        : undefined
                    }
                    {...register(`estudiante.${fieldName}`, {
                      ...(fieldName === "cedula" && {
                        min: {
                          value: 1000000,
                          message: "La cédula debe ser mayor a 1,000,000",
                        },
                        max: {
                          value: 50000000,
                          message: "La cédula no puede superar 50,000,000",
                        },
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Solo se permiten números",
                        },
                      }),
                      ...(fieldName === "telefono" && {
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
                          message: "Solo números, sin espacios ni símbolos",
                        },
                      }),
                      ...(fieldName === "correo" && {
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Correo electrónico inválido",
                        },
                      }),
                    })}
                  />
                );
              })}
            </Box>
          </Box>

          {/* ================= DATOS ACTUALES ================= */}
          <Box>
            <Typography variant="h6" mb={1}>
              Datos actuales
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={2}>
              Información registrada del estudiante
            </Typography>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
                boxShadow: {
                  xs: "none",
                  md: "0 6px 16px rgba(0,0,0,0.12)",
                },
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 1.5,
                alignSelf: "flex-start",
              }}
            >
              <Dato label="Nombre" value={nombre} />
              <Dato label="Apellido" value={apellido} />
              <Dato label="Cédula" value={cedula} />
              <Dato label="Correo" value={correo} />
              <Dato label="Teléfono" value={telefono} />
              <Dato label="Lugar de nacimiento" value={lugar_nacimiento} />
              <Dato label="Entidad Federal" value={entidad_federal} />
            </Box>
          </Box>
          {showError && (
            <div className={estilo.mensaje_error} style={{ marginTop: 10 }}>
              {errorMsg || "Ocurrió un error"}
            </div>
          )}
        </Box>

        {/* ================= BOTÓN ================= */}
        <Box mt={4} textAlign="center">
          <Button variant="success" type="submit" size="lg">
            Actualizar
          </Button>
        </Box>
      </form>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmitOrPatch, onInvalid)}>
      {/* CONTENEDOR PRINCIPAL */}
      {/* CONTENEDOR PRINCIPAL */}
      <Box
        sx={{
          display: "grid",

          gap: 6,
        }}
      >
        {/* ================= ESTUDIANTES ================= */}
        <Box>
          <Typography variant="h6" mb={3} noWrap>
            Estudiantes
          </Typography>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr", // móvil
                sm: "1fr 1fr", // desktop → 2 por fila
              },
              gap: 2,
            }}
          >
            {estudiantesCampos.map((elemento) => {
              const fieldName = elemento.name;
              const fieldError = (errors.estudiante as any)?.[fieldName];

              return (
                <TextField
                  key={elemento.name}
                  size="small"
                  label={elemento.label}
                  type={
                    fieldName === "cedula" || fieldName === "telefono"
                      ? "text"
                      : "text"
                  }
                  error={!!fieldError}
                  helperText={fieldError?.message as string}
                  inputProps={
                    fieldName === "telefono" || fieldName === "cedula"
                      ? { inputMode: "numeric" }
                      : undefined
                  }
                  {...register(`estudiante.${fieldName}`, {
                    required: "Este campo es obligatorio",

                    ...(fieldName === "cedula" && {
                      min: {
                        value: 1000000,
                        message: "La cédula debe ser mayor a 1,000,000",
                      },
                      max: {
                        value: 50000000,
                        message: "La cédula no puede superar 50,000,000",
                      },
                      pattern: {
                        value: /^[0-9]+$/,
                        message: "Solo se permiten números",
                      },
                    }),

                    ...(fieldName === "telefono" && {
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
                        message: "Solo números, sin espacios ni símbolos",
                      },
                    }),

                    ...(fieldName === "correo" && {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Correo electrónico inválido",
                      },
                    }),
                  })}
                />
              );
            })}
          </Box>
        </Box>
        <RepresentanteAutocomplete
          onSelect={(rep: any) => {
            const fields = [
              "nombre",
              "apellido",
              "cedula",
              "telefono",
              "correo",
              "direccion",
            ];

            if (!rep) {
              // limpiar campos
              fields.forEach((f) => {
                setValue(`representante1.${f}`, "");
              });

              setRepresentanteExistente(null);
              return;
            }

            setRepresentanteExistente(rep);
            fields.forEach((f) => {
              let value = rep[f] || "";

              if (f === "telefono") {
                value = value.replace(/\D/g, "");
              }

              setValue(`representante1.${f}`, value);
            });
          }}
        />

        {/* ================= REPRESENTANTES ================= */}
        <Box>
          <Typography variant="h6" mb={3} noWrap>
            Representantes
          </Typography>

          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
              },
              gap: 2,
            }}
          >
            {representanteCampos.map((elemento) => {
              const fieldName = elemento.toLowerCase();
              const fieldError = (errors.representante1 as any)?.[fieldName];

              return (
                <Controller
                  name={`representante1.${fieldName}`}
                  control={control}
                  defaultValue=""
                  rules={{
                    required: "Este campo es obligatorio",
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      key={elemento}
                      size="small"
                      label={elemento}
                      error={!!fieldError}
                      helperText={fieldError?.message as string}
                      inputProps={
                        fieldName === "telefono" || fieldName === "cedula"
                          ? { inputMode: "numeric" }
                          : undefined
                      }
                      {...register(`representante1.${fieldName}`, {
                        required: "Este campo es obligatorio",

                        ...(fieldName === "cedula" && {
                          min: {
                            value: 1000000,
                            message: "La cédula debe ser mayor a 1,000,000",
                          },
                          max: {
                            value: 30000000,
                            message: "La cédula no puede superar 30,000,000",
                          },
                          pattern: {
                            value: /^[0-9]+$/,
                            message: "Solo se permiten números",
                          },
                        }),

                        ...(fieldName === "telefono" && {
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
                            message: "Solo números, sin espacios ni símbolos",
                          },
                        }),

                        ...(fieldName === "correo" && {
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Correo electrónico inválido",
                          },
                        }),
                      })}
                    />
                  )}
                />
              );
            })}
          </Box>
          {!segundoRepresentante && (
            <Box mt={3} textAlign="right">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setSegundoRepresentante(true)}
              >
                Agregar otro representante
              </Button>
            </Box>
          )}
        </Box>

        {/* ================= REPRESENTANTE ADICIONAL - CENTRADO ================= */}
        {segundoRepresentante && (
          <Box
            sx={{
              gridColumn: { xs: "1", md: "1 / span 2" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transition: "all 0.3s ease",
              opacity: segundoRepresentante ? 1 : 0,
              transform: segundoRepresentante
                ? "translateY(0)"
                : "translateY(-10px)",
            }}
          >
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
              sx={{ width: "100%", maxWidth: "800px" }}
            >
              <Typography variant="h6">Representante adicional</Typography>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setSegundoRepresentante(false)}
              >
                Quitar representante adicional
              </Button>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px dashed",
                borderColor: "divider",
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },
                gap: 2,
                width: "100%",
                maxWidth: "800px",
              }}
            >
              {representanteCampos.map((elemento) => {
                const fieldName = elemento.toLowerCase();
                const fieldError = (errors.representante2 as any)?.[fieldName];

                return (
                  <TextField
                    key={elemento}
                    size="small"
                    label={elemento}
                    error={!!fieldError}
                    helperText={fieldError?.message as string}
                    inputProps={
                      fieldName === "telefono" || fieldName === "cedula"
                        ? { inputMode: "numeric" }
                        : undefined
                    }
                    {...register(`representante2.${fieldName}`, {
                      ...(segundoRepresentante && {
                        required: "Este campo es obligatorio",
                      }),

                      ...(fieldName === "cedula" && {
                        min: {
                          value: 1000000,
                          message: "La cédula debe ser mayor a 1,000,000",
                        },
                        max: {
                          value: 30000000,
                          message: "La cédula no puede superar 30,000,000",
                        },
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Solo se permiten números",
                        },
                      }),

                      ...(fieldName === "telefono" && {
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
                          message: "Solo números, sin espacios ni símbolos",
                        },
                      }),

                      ...(fieldName === "correo" && {
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Correo electrónico inválido",
                        },
                      }),
                    })}
                  />
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
      {/* ================= BOTÓN ================= */}
      <Box mt={5} textAlign="center">
        <Button variant="success" type="submit" size="lg">
          Registrar
        </Button>
        {showError && (
          <div className={estilo.mensaje_error} style={{ marginTop: 8 }}>
            {errorMsg || "Ocurrió un error"} {/* 👈 MOSTRAR MENSAJE */}
          </div>
        )}
      </Box>
    </form>
  );
}

//
//
//
export default function BasicModal({
  btnText,
  title,
  id_estudiante,
  nombre,
  apellido,
  cedula,
  correo,
  telefono,
  lugar_nacimiento,
  entidad_federal,
  onSuccess,
  id_grado,
  buttonProps,
}: BasicModalProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <ButtonMUI onClick={handleOpen} {...buttonProps}>
        {btnText}
      </ButtonMUI>
      <div>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Typography id="modal-modal-title" variant="h5" component="h2">
              {title}
            </Typography>
            <br />
            <Form
              id_to_rel={id_grado}
              onSuccess={() => {
                if (onSuccess) onSuccess(); // Llama a onSuccess si existe
                handleClose(); // Cierra el modal
              }}
              id_estudiante={id_estudiante ? id_estudiante : undefined}
              nombre={nombre}
              apellido={apellido}
              cedula={cedula}
              correo={correo}
              telefono={telefono}
              lugar_nacimiento={lugar_nacimiento}
              entidad_federal={entidad_federal}
            />
          </Box>
        </Modal>
      </div>
    </>
  );
}
