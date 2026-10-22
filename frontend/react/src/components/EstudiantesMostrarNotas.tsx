import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { obtenerMisNotas } from "../api/estudianteNotas";
import { SortableTable } from "./ui/Table";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

type NotaRaw = {
  asignatura: string;
  lapso: number;
  nota: number | "IN" | null;
  anio: number;
  seccion: string;
};

type Fila = {
  asignatura: string;
  // Cambio: las notas renderizan color usando componentes dentro de la tabla.
  lapso1: ReactNode;
  lapso2: ReactNode;
  lapso3: ReactNode;
  definitiva: ReactNode;
};

function HistorialAcademico() {
  const [data, setData] = useState<NotaRaw[]>([]);

  useEffect(() => {
    obtenerMisNotas().then(setData);
  }, []);

  // ==========================
  // AGRUPAR
  // ==========================
  const agrupado: Record<string, NotaRaw[]> = {};

  data.forEach((item) => {
    if (!agrupado[item.asignatura]) {
      agrupado[item.asignatura] = [];
    }
    agrupado[item.asignatura].push(item);
  });

  // ==========================
  // FILAS CON ESTILO
  // ==========================
  const getColor = (nota: number | "IN" | null) => {
    if (nota === null) return "text.disabled";
    if (nota === "IN") return "error.main";
    if (nota >= 16) return "success.main";
    if (nota >= 10) return "warning.main";
    return "error.main";
  };

  const filas: Fila[] = Object.entries(agrupado).map(([asignatura, notas]) => {
    const l1 = notas.find((n) => n.lapso === 1)?.nota ?? null;
    const l2 = notas.find((n) => n.lapso === 2)?.nota ?? null;
    const l3 = notas.find((n) => n.lapso === 3)?.nota ?? null;

    // IN cuenta como 0 en la definitiva
    const notasValidas = [l1, l2, l3]
      .filter((n): n is number | "IN" => n !== null)
      .map((n) => (n === "IN" ? 0 : n));

    const definitiva =
      notasValidas.length > 0
        ? (
            notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
          ).toFixed(2)
        : "-";

        const renderNota = (n: number | "IN" | null) => (
      <Box
        component="span"
        sx={{
          color: getColor(n),
          fontWeight: 600,
        }}
      >
        {n ?? "-"}
      </Box>
    );

    return {
      asignatura,
      lapso1: renderNota(l1),
      lapso2: renderNota(l2),
      lapso3: renderNota(l3),
      definitiva:
        definitiva !== "-" ? (
          <span
            style={{ color: getColor(Number(definitiva)), fontWeight: 700 }}
          >
            {definitiva}
          </span>
        ) : (
          "-"
        ),
    };
  });

  const columnas = [
    { label: "Asignatura", key: "asignatura", sortable: true },
    { label: "Lapso 1", key: "lapso1" },
    { label: "Lapso 2", key: "lapso2" },
    { label: "Lapso 3", key: "lapso3" },
    { label: "Definitiva", key: "definitiva", sortable: true },
  ] as const;

  const anio = data[0]?.anio;
  const seccion = data[0]?.seccion;

  // ==========================
  // UI
  // ==========================
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* HEADER */}
      <Box
        sx={{
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="700">
          Calificaciones
        </Typography>

        {anio && seccion && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {anio}° año — Sección {seccion.toUpperCase()}
          </Typography>
        )}
      </Box>

      {/* CARD */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,

          // 🔥 FONDO ADAPTATIVO
          bgcolor: "background.paper",

          // 🔥 BORDE SUTIL (clave en light mode)
          border: "1px solid",
          borderColor: "divider",

          // 🔥 SOMBRA MODERNA
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 4px 20px rgba(0,0,0,0.6)"
              : "0 4px 20px rgba(0,0,0,0.08)",

          // 🔥 SUAVIDAD
          transition: "all 0.2s ease",

          "&:hover": {
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 6px 25px rgba(0,0,0,0.8)"
                : "0 6px 25px rgba(0,0,0,0.12)",
          },
        }}
      >
        {filas.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "text.secondary",
            }}
          >
            <Typography>No tienes notas registradas aún</Typography>
          </Box>
        ) : (
          <SortableTable columns={columnas} rows={filas} />
        )}
      </Paper>
    </Box>
  );
}

export default HistorialAcademico;
