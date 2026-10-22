import React, { useEffect, useState } from "react";
import type { Administrador } from "../interfaces/interface";
import {
  obtenerAdministradores,
  eliminarAdministrador,
  restaurarAdministrador,
} from "@/api/administradores";
import { useForm } from "react-hook-form";
import TextField from "@mui/material/TextField";
import { actualizarAdministrador } from "@/api/administradores";
import estilo from "@/styles/grados.module.css"; // ajusta ruta si cambia

import ButtonMUI from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { SortableTable } from "./ui/Table";
import { Button } from "react-bootstrap";

import {
  EditarEstudiante,
  EliminarEstudiante,
  AgregarEstudiantes,
} from "./svg";

import { OptionsModal } from "./ui/BasicModal";
import { FormularioModal } from "./FormularioModal";

// Simple Dato component for displaying label and value
const Dato = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="subtitle2">{label}:</Typography>
    <Typography variant="body2">{value ?? "-"}</Typography>
  </Box>
);

// ======================
// TIPOS
// ======================
type FilaAdmin = {
  nombre: string;
  apellido: string;
  cedula: number;
  // Cambio: la tabla de administradores tambien muestra telefono.
  telefono?: string | null;
  correo: string;
  estado: string;
  fecha: string;
  acciones: React.ReactNode;
};
interface FormAdminProps {
  id_admin?: number;
  onSuccess: () => void;
  nombre?: string;
  apellido?: string;
  cedula?: number;
  correo?: string;
  telefono?: string;
  rol?: string;
  estado?: string;
}

const adminCampos = ["Nombre", "Apellido", "Cedula", "Correo", "Telefono"];

const clean = (v: any) => (typeof v === "string" ? v.trim() : v);

export function FormAdministrador({
  id_admin,
  onSuccess,
  nombre,
  apellido,
  cedula,
  correo,
  telefono,
}: FormAdminProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, any>>();

  const [errorMsg, setErrorMsg] = useState("");
  const [showError, setShowError] = useState(false);

  const onSubmitOrPatch = async (data: Record<string, any>) => {
    console.log("enviado");
    setShowError(false);
    setErrorMsg("");

    const adminObject = {
      ...(data.admin?.nombre && { nombre: clean(data.admin.nombre) }),
      ...(data.admin?.apellido && { apellido: clean(data.admin.apellido) }),
      ...(data.admin?.cedula && {
        cedula: Number(data.admin.cedula),
      }),
      ...(data.admin?.correo && { correo: clean(data.admin.correo) }),
      ...(data.admin?.telefono && { telefono: clean(data.admin.telefono) }),
    };

    if (!Object.keys(adminObject).length) {
      setErrorMsg("Debes modificar al menos un campo para actualizar");
      setShowError(true);
      return;
    }
    try {
      const update = await actualizarAdministrador(id_admin!, adminObject);
      console.log(update);
      reset();
      onSuccess();
    } catch (err: any) {
      console.log("ERROR FRONT:", err);

      setErrorMsg(err?.message || "Error al actualizar administrador");
      setShowError(true);
    }
  };

  const onInvalid = () => setShowError(true);

  const getValidations = (campo: string) => {
    const field = campo.toLowerCase();

    const base = {
      required: false,
    };

    if (field === "cedula") {
      return {
        ...base,
        minLength: {
          value: 7,
          message: "La cédula debe tener al menos 7 dígitos",
        },
        maxLength: {
          value: 8,
          message: "La cédula no puede tener más de 8 dígitos",
        },
        pattern: {
          value: /^[0-9]+$/,
          message: "Solo se permiten números",
        },
      };
    }

    if (field === "telefono") {
      return {
        ...base,
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
      };
    }

    if (field === "correo") {
      return {
        ...base,
        maxLength: {
          value: 120,
          message: "El correo es demasiado largo",
        },
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: "Correo electrónico inválido",
        },
      };
    }

    return base;
  };

  // 🔴 MODO EDITAR
  if (id_admin !== undefined) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSubmit(onSubmitOrPatch, onInvalid)(e);
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "2.2fr 1.3fr",
            },
            gap: 4,
            maxWidth: 900,
            mx: "auto",
            alignItems: "flex-start",
          }}
        >
          {/* ================= FORM ================= */}
          <Box>
            <Typography variant="h6" mb={1}>
              Actualizar administrador
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
                  md: "1fr 1fr",
                },
                gap: 2,
              }}
            >
              {adminCampos.map((campo) => {
                const fieldName = campo.toLowerCase();
                const fieldError = (errors as any)?.admin?.[fieldName];

                return (
                  <TextField
                    key={campo}
                    size="small"
                    fullWidth
                    label={campo}
                    error={!!fieldError}
                    helperText={fieldError?.message as string}
                    inputProps={
                      fieldName === "telefono"
                        ? { inputMode: "numeric", maxLength: 11 }
                        : fieldName === "cedula"
                          ? { inputMode: "numeric", maxLength: 8 }
                          : undefined
                    }
                    {...register(`admin.${fieldName}`, getValidations(campo))}
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
              Información registrada del administrador
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
                gap: 1.5,
              }}
            >
              <Dato label="Nombre" value={nombre} />
              <Dato label="Apellido" value={apellido} />
              <Dato label="Cédula" value={cedula} />
              <Dato label="Correo" value={correo} />
              <Dato label="Teléfono" value={telefono} />
            </Box>
          </Box>
        </Box>

        <Box mt={4} textAlign="center" alignContent={"center"}>
          <ButtonMUI
            variant="contained"
            color="success"
            type="submit"
            size="large"
            onClick={() => console.log("click boton")}
          >
            Actualizar
          </ButtonMUI>
        </Box>
        {showError && (
          <div
            className={estilo.mensaje_error}
            style={{ marginTop: 10, textAlign: "center" }}
          >
            {errorMsg || "Ocurrió un error"}
          </div>
        )}
      </form>
    );
  }

  return null;
}

// ======================
// COMPONENTE
// ======================
function AdministradoresComponent() {
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [adminEliminar, setAdminEliminar] = useState<number | null>(null);
  const [adminEditar, setAdminEditar] = useState<number | null>(null);
  const [adminReset, setAdminReset] = useState<number | null>(null);
  const [openCrear, setOpenCrear] = useState(false);

  // ======================
  // CARGAR
  // ======================
  const cargar = async () => {
    const data = await obtenerAdministradores();
    setAdmins(data);
  };

  useEffect(() => {
    cargar();
  }, []);

  // ======================
  // COLUMNAS
  // ======================
  const columnas = [
    { label: "Nombre", key: "nombre", sortable: true, width: 150 },
    { label: "Apellido", key: "apellido", sortable: true, width: 150 },
    { label: "Cédula", key: "cedula", sortable: true, width: 130 },
    { label: "Telefono", key: "telefono", sortable: false, width: 130 },
    { label: "Correo", key: "correo", sortable: true, width: 220 },
    { label: "Fecha creación", key: "fecha", sortable: true, width: 160 },
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
  const filas: FilaAdmin[] = admins.map((admin) => {
    const activo = !admin.deleted_at;

    return {
      nombre: admin.nombre,
      apellido: admin.apellido,
      cedula: admin.cedula,
      telefono: admin.telefono,
      correo: admin.correo,
      estado: activo ? "Activo" : "Inactivo",
      fecha: admin.created_at
        ? new Date(admin.created_at).toLocaleDateString()
        : "-",

      acciones: (
        <div
          style={{
            display: "flex",
            flexDirection: "row", // ✅ Cambiar de "column" a "row"
            justifyContent: "center",
            alignItems: "center",
            gap: 8, // Espacio entre botones
          }}
        >
          {/* EDITAR */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={() => setAdminEditar(admin.id)}
          >
            <EditarEstudiante />
          </ButtonMUI>
          {/* RESET PASSWORD */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={() => setAdminReset(admin.id)}
          >
            🔐
          </ButtonMUI>

          {/* SOFT DELETE / RESTORE */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={() => setAdminEliminar(admin.id)}
          >
            <EliminarEstudiante />
          </ButtonMUI>
        </div>
      ),
    };
  });

  // ======================
  // RENDER
  // ======================
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
          Gestion de administradores
        </Typography>

        <div style={{ marginBottom: 12 }}>
          <ButtonMUI
            variant="contained"
            startIcon={<AgregarEstudiantes />}
            onClick={() => setOpenCrear(true)}
          >
            Nuevo administrador
          </ButtonMUI>
        </div>
      </Box>

      {admins.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay mas administradores registrados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Presiona "Nuevo administrador" para agregar el primero
          </Typography>
        </Box>
      ) : (
        <SortableTable columns={columnas} rows={filas} maxWidth={1200} />
      )}

      {/* ======================
          MODAL ELIMINAR
         ====================== */}
      <OptionsModal
        open={adminEliminar !== null}
        onClose={() => setAdminEliminar(null)}
        title="Cambiar estado del administrador"
        content={
          <div style={{ margin: 20, textAlign: "center" }}>
            ¿Deseas activar/desactivar este administrador?
          </div>
        }
        optionalBtn={
          <Button
            variant="success"
            onClick={async () => {
              if (!adminEliminar) return;

              const admin = admins.find((a) => a.id === adminEliminar);

              if (admin?.deleted_at) {
                await restaurarAdministrador(adminEliminar);
              } else {
                await eliminarAdministrador(adminEliminar);
              }

              await cargar();
              setAdminEliminar(null);
            }}
          >
            Aceptar
          </Button>
        }
      />

      {/* ======================
          MODAL RESET PASSWORD
         ====================== */}
      <OptionsModal
        open={adminReset !== null}
        onClose={() => setAdminReset(null)}
        title="Resetear contraseña"
        content={
          <div style={{ margin: 20, textAlign: "center" }}>
            Se generará una contraseña temporal basada en la cédula.
          </div>
        }
        optionalBtn={
          <Button
            variant="warning"
            onClick={async () => {
              try {
                const res = await fetch(
                  `http://localhost:1234/api/users/reset-password/${adminReset}`,
                  {
                    method: "PATCH",
                  },
                );
                const result = await res.json();
                if (!res.ok) {
                  throw new Error(
                    result.message || "Error al actualizar contraseña",
                  );
                }
                console.log("reset password", adminReset);
                setAdminReset(null);
                return result;
              } catch (error) {
                console.log(error);

                throw error;
              }
            }}
          >
            Resetear
          </Button>
        }
      />
      <OptionsModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        title="Agregar nuevo administrador"
        content={
          <div style={{ margin: 20, textAlign: "center" }}>
            <FormularioModal
              campos={[
                "Nombre",
                "Apellido",
                "Cedula",
                "Telefono",
                "Correo",
                "Direccion",
              ]}
              onSuccess={() => {
                setOpenCrear(false);
                cargar();
              }}
              mode="administradores"
            />
          </div>
        }
      />
      {/* ======================
    MODAL EDITAR
   ====================== */}
      <OptionsModal
        open={adminEditar !== null}
        onClose={() => setAdminEditar(null)}
        title="Editar administrador"
        content={
          adminEditar && (
            <FormAdministrador
              id_admin={adminEditar}
              onSuccess={() => {
                setAdminEditar(null);
                cargar();
              }}
              {...admins.find((a) => a.id === adminEditar)}
            />
          )
        }
        wide={true}
      />
    </>
  );
}

export default AdministradoresComponent;
