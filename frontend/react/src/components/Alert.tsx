import { useEffect } from "react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import type { AlertColor } from "@mui/material/Alert";

export default function OutlinedAlerts() {}

interface AlertContent {
  severity: AlertColor;
  mensaje: string;
}

interface AlertProps {
  duration: number;
  onClose: () => void;
  action: "agregar" | "eliminar" | "actualizar" | "error";
}
const contenidoAlert: Record<string, AlertContent> = {
  agregar: {
    severity: "success",
    mensaje: "Registrado exitosamente",
  },
  eliminar: {
    severity: "error",
    mensaje: "Eliminado exitosamente",
  },
  actualizar: {
    severity: "info",
    mensaje: "Se han guardado los cambios",
  },
  error: {
    severity: "error",
    mensaje: "Valor inválido. Debe ser un número entre 0 y 20",
  },
};

export function AlertDemo({ duration, onClose, action }: AlertProps) {
  const { mensaje } = contenidoAlert[action];
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <Stack
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "60%",
        minWidth: "300px",
        maxWidth: "90%",
        zIndex: 9999,
        spacing: 2,
      }}
      spacing={2}
    >
      <Alert variant="outlined" severity={contenidoAlert[action].severity}>
        {mensaje}
      </Alert>
    </Stack>
  );
}
