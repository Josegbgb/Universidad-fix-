import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { OptionsModal } from "./ui/BasicModal";
import { AlertDemo } from "./Alert";
import { enviarRecordatorioNotasPendientes } from "@/api/telegram";

type UsuarioRow = {
  id: number;
  email: string;
  role: string;
  activo: number;
  created_at: string;
  nombre: string;
  apellido: string;
  cedula: string;
};

export default function GestionarUsuarios() {
  type Order = "asc" | "desc";

  const [orderBy, setOrderBy] = useState<string>("nombre");
  const [order, setOrder] = useState<Order>("asc");

  function handleSort(field: string) {
    const isAsc = orderBy === field && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(field);
  }

  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([]);
  const [showAlert, setShowAlert] = useState<"" | "agregar" | "eliminar">("");
  const [lapsoRecordatorio, setLapsoRecordatorio] = useState(1);
  const [recordatorioLoading, setRecordatorioLoading] = useState(false);
  const [recordatorioMensaje, setRecordatorioMensaje] = useState("");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<{
    id: number;
    nombre: string;
    accion: "toggle" | "reset";
  } | null>(null);

  function formatFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString();
  }

  // =====================
  // 🔄 CARGAR
  // =====================
  async function cargar() {
    const email = localStorage.getItem("email");
    const res = await fetch(
      `http://localhost:1234/api/users/users?emailExcluir=${email}`,
    );
    const data = await res.json();
    setUsuarios(data.body || []);
  }

  // =====================
  // 🗑 ELIMINAR
  // =====================

  // =====================
  // 🔄 TOGGLE
  // =====================
  async function toggleEstado(id: number) {
    await fetch(`http://localhost:1234/api/users/status/${id}`, {
      method: "PATCH",
    });
    await cargar();
    setUsuarioSeleccionado(null);
  }

  // =====================
  // 🔑 RESET PASS
  // =====================
  async function resetPassword(id: number) {
    await fetch(`http://localhost:1234/api/users/reset-password/${id}`, {
      method: "PATCH",
    });
    setShowAlert("agregar");
    setUsuarioSeleccionado(null);
  }

  async function enviarRecordatorio() {
    setRecordatorioLoading(true);
    setRecordatorioMensaje("");
    try {
      // Cambio: dispara el endpoint admin de recordatorio a profesores.
      const data = await enviarRecordatorioNotasPendientes(lapsoRecordatorio);
      setRecordatorioMensaje(
        `Profesores detectados: ${data.profesoresDetectados}. Notificados: ${data.notificados}. Sin Telegram: ${data.sinTelegram}.`,
      );
    } catch (error) {
      setRecordatorioMensaje(
        error instanceof Error ? error.message : "ERROR_TELEGRAM",
      );
    } finally {
      setRecordatorioLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // =====================
  // 🎨 RENDER
  // =====================
  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (orderBy) {
      case "nombre":
        valueA = `${a.nombre} ${a.apellido}`.toLowerCase();
        valueB = `${b.nombre} ${b.apellido}`.toLowerCase();
        break;

      case "role":
        valueA = a.role;
        valueB = b.role;
        break;

      case "cedula":
        valueA = a.cedula;
        valueB = b.cedula;
        break;

      case "fecha":
        valueA = new Date(a.created_at).getTime();
        valueB = new Date(b.created_at).getTime();
        break;

      case "estado":
        valueA = a.activo;
        valueB = b.activo;
        break;

      default:
        return 0;
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return order === "asc" ? valueA - valueB : valueB - valueA;
    }

    return order === "asc"
      ? String(valueA).localeCompare(String(valueB))
      : String(valueB).localeCompare(String(valueA));
  });

  return (
    <>
      <Box sx={{ p: 3 }}>
        {/* HEADER */}
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
            Gestión de Usuarios
          </Typography>
          <TextField
            select
            size="small"
            label="Lapso"
            value={lapsoRecordatorio}
            onChange={(event) =>
              setLapsoRecordatorio(Number(event.target.value))
            }
            sx={{ width: 120 }}
          >
            <MenuItem value={1}>1</MenuItem>
            <MenuItem value={2}>2</MenuItem>
            <MenuItem value={3}>3</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            onClick={enviarRecordatorio}
            disabled={recordatorioLoading}
          >
            {recordatorioLoading
              ? "Enviando..."
              : "Enviar recordatorio a profesores"}
          </Button>
        </Box>
        {recordatorioMensaje && (
          <Typography
            variant="body2"
            color={
              recordatorioMensaje.includes("ERROR") ? "error" : "success.main"
            }
            sx={{ mb: 2 }}
          >
            {recordatorioMensaje}
          </Typography>
        )}

        {/* TABLA */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: 600,
            borderRadius: 2,
            boxShadow: 3,
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "nombre"}
                    direction={orderBy === "nombre" ? order : "asc"}
                    onClick={() => handleSort("nombre")}
                  >
                    <strong>Nombre</strong>
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "cedula"}
                    direction={orderBy === "cedula" ? order : "asc"}
                    onClick={() => handleSort("cedula")}
                  >
                    <strong>Cédula</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "role"}
                    direction={orderBy === "role" ? order : "asc"}
                    onClick={() => handleSort("role")}
                  >
                    <strong>Rol</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "estado"}
                    direction={orderBy === "estado" ? order : "asc"}
                    onClick={() => handleSort("estado")}
                  >
                    <strong>Estado</strong>
                  </TableSortLabel>
                </TableCell>

                <TableCell>
                  <TableSortLabel
                    active={orderBy === "fecha"}
                    direction={orderBy === "fecha" ? order : "asc"}
                    onClick={() => handleSort("fecha")}
                  >
                    <strong>Fecha creación</strong>
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">
                  <strong>Acciones</strong>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {usuariosOrdenados.map((u) => (
                <TableRow
                  key={u.id}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(127,126,126,0.12)",
                    },
                  }}
                >
                  <TableCell>
                    {u.nombre} {u.apellido}
                  </TableCell>

                  <TableCell sx={{ maxWidth: 220 }}>
                    <Typography noWrap title={u.email} sx={{ fontSize: 14 }}>
                      {u.email}
                    </Typography>
                  </TableCell>

                  <TableCell>{u.cedula}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {u.role}
                  </TableCell>

                  {/* ✅ CHIP ESTADO */}
                  <TableCell>
                    <Chip
                      label={u.activo ? "Activo" : "Inactivo"}
                      color={u.activo ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>{formatFecha(u.created_at)}</TableCell>

                  {/* 🔥 ACCIONES EN COLUMNA */}
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        minWidth: 130,
                      }}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        color={u.activo ? "error" : "success"}
                        onClick={() =>
                          setUsuarioSeleccionado({
                            id: u.id,
                            nombre: `${u.nombre} ${u.apellido}`,
                            accion: "toggle",
                          })
                        }
                      >
                        {u.activo ? "Desactivar Usuario" : "Activar Usuario"}
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={() =>
                          setUsuarioSeleccionado({
                            id: u.id,
                            nombre: `${u.nombre} ${u.apellido}`,
                            accion: "reset",
                          })
                        }
                      >
                        Resetear Contraseña
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <OptionsModal
        open={usuarioSeleccionado !== null}
        onClose={() => setUsuarioSeleccionado(null)}
        title={
          usuarioSeleccionado?.accion === "toggle"
            ? usuarios.find((u) => u.id === usuarioSeleccionado.id)?.activo
              ? "Desactivar Usuario"
              : "Activar Usuario"
            : "Resetear Contraseña"
        }
        content={
          <div style={{ margin: "20px", textAlign: "center" }}>
            {usuarioSeleccionado?.accion === "toggle" ? (
              <>
                ¿Estás seguro de{" "}
                {usuarios.find((u) => u.id === usuarioSeleccionado.id)?.activo
                  ? "desactivar"
                  : "activar"}{" "}
                al usuario <strong>{usuarioSeleccionado.nombre}</strong>?
              </>
            ) : (
              <>
                ¿Estás seguro de resetear la contraseña de{" "}
                <strong>{usuarioSeleccionado?.nombre}</strong>? Se generará una
                contraseña temporal basada en su cédula.
              </>
            )}
          </div>
        }
        optionalBtn={
          <Button
            variant="contained"
            color={
              usuarioSeleccionado?.accion === "toggle" ? "primary" : "warning"
            }
            onClick={() => {
              if (usuarioSeleccionado?.accion === "toggle") {
                if (usuarioSeleccionado) toggleEstado(usuarioSeleccionado.id);
              } else {
                if (usuarioSeleccionado) resetPassword(usuarioSeleccionado.id);
              }
            }}
          >
            Confirmar
          </Button>
        }
      />
      {showAlert && (
        <AlertDemo
          duration={2000}
          action={showAlert}
          onClose={() => setShowAlert("")}
        />
      )}
    </>
  );
}
