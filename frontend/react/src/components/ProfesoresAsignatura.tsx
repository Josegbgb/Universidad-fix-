import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Typography,
  Box,
  TextField,
} from "@mui/material";
import {
  obtenerNotasAsignacion,
  guardarNota,
} from "@/api/ProfesoresPonerNotas";
import { AlertDemo } from "./Alert";

type Raw = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  cedula: number;
  telefono: string;
  lapso: number;
  nota: number | "IN" | null;
  id_rel_estudiante_grado: number;
};

export default function ProfesorAsignatura() {
  const { id } = useParams();
  const id_rel = Number(id);
  const [alert, setAlert] = useState<{
    type: "agregar" | "actualizar" | "eliminar" | "error";
  } | null>(null);

  const [data, setData] = useState<Raw[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");

  const cargar = async () => {
    const res = await obtenerNotasAsignacion(id_rel);
    setData(res);
  };

  useEffect(() => {
    cargar();
  }, [id_rel]);

  // 🔹 agrupar por estudiante
  const agrupado: Record<number, Raw[]> = {};

  data.forEach((item) => {
    if (!agrupado[item.id_estudiante]) {
      agrupado[item.id_estudiante] = [];
    }
    agrupado[item.id_estudiante].push(item);
  });

  // 🔹 guardar nota con ENTER
  const handleSave = async (reg: Raw, lapso: number) => {
        // Cambio: acepta "IN" (inasistente) además de notas de 0 a 20.
    const texto = tempValue.trim().toUpperCase();
    const nota: number | "IN" | null =
      texto === "" ? null : texto === "IN" ? "IN" : Number(texto);

    if (typeof nota === "number" && (isNaN(nota) || nota < 0 || nota > 20)) {
      setAlert({ type: "error" });
      return;
    }

    await guardarNota({
      id_rel_estudiante_grado: reg.id_rel_estudiante_grado,
      id_rel_grado_asignatura: id_rel,
      id_lapso: lapso,
      nota,
    });

    setEditing(null);
    setAlert({ type: "actualizar" }); // ✅ éxito
    cargar();
  };
  console.log(data);
  return (
    <>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="700">
            Registro de Notas
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona y actualiza las calificaciones de los estudiantes
          </Typography>
        </Box>

        {data.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 6,
              color: "text.secondary",
            }}
          >
            <Typography variant="h6">
              No hay estudiantes en este grado
            </Typography>

            <Typography variant="body2">
              Aún no hay registros disponibles para esta asignación
            </Typography>
          </Box>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              mx: "auto",

              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              maxWidth: 1200,
              overflow: "hidden",

              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 4px 20px rgba(0,0,0,0.6)"
                  : "0 4px 20px rgba(0,0,0,0.08)",

              transition: "all 0.2s ease",

              "&:hover": {
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 6px 25px rgba(0,0,0,0.8)"
                    : "0 6px 25px rgba(0,0,0,0.12)",
              },
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "action.hover",
                    }}
                  >
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Nombre
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Apellido
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Cédula
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Teléfono
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Primer Lapso
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Segundo Lapso
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Tercer Lapso
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 600, color: "text.secondary" }}
                    >
                      Definitiva
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {Object.values(agrupado).map((notas, i) => {
                    const est = notas[0];

                    const getNota = (lapso: number) =>
                      notas.find((n) => n.lapso === lapso)?.nota ?? "";

                    const l1 = getNota(1);
                    const l2 = getNota(2);
                    const l3 = getNota(3);

                    // IN cuenta como 0 en la definitiva (igual que en el backend)
                    const validas = [l1, l2, l3]
                      .filter((n) => n !== "")
                      .map((n) => (n === "IN" ? 0 : Number(n)));

                    const definitiva =
                      validas.length > 0
                        ? (
                            validas.reduce((a, b) => a + b, 0) / validas.length
                          ).toFixed(2)
                        : "-";

                    return (
                      <TableRow
                        key={i}
                        sx={{
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "action.hover",
                          },
                        }}
                      >
                        <TableCell>{est.nombre}</TableCell>
                        <TableCell>{est.apellido}</TableCell>
                        <TableCell>{est.cedula}</TableCell>
                        <TableCell>{est.telefono}</TableCell>

                        {[1, 2, 3].map((lapso) => {
                          const key = `${est.id_estudiante}-${lapso}`;
                          const valor = getNota(lapso);

                          return (
                            <TableCell key={lapso}>
                              {editing === key ? (
                                <TextField
                                  size="small"
                                  value={tempValue}
                                  autoFocus
                                  onChange={(e) => setTempValue(e.target.value)}
                                  onBlur={() => setEditing(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSave(est, lapso);
                                    }
                                  }}
                                  inputProps={{ min: 0, max: 20 }}
                                  sx={{
                                    width: "70px",

                                    "& .MuiInputBase-root": {
                                      backgroundColor: "transparent",
                                      color: "inherit",
                                      borderRadius: 2,
                                    },

                                    "& input": {
                                      textAlign: "center",
                                      fontWeight: 600,
                                    },

                                    "& fieldset": {
                                      borderColor: "divider",
                                    },

                                    "&:hover fieldset": {
                                      borderColor: "primary.main",
                                    },

                                    "&.Mui-focused fieldset": {
                                      borderColor: "primary.main",
                                    },
                                  }}
                                />
                              ) : (
                                <Box
                                  onDoubleClick={() => {
                                    setEditing(key);
                                    setTempValue(String(valor ?? ""));
                                  }}
                                  sx={{
                                    cursor: "pointer",
                                    px: 1,
                                    py: 0.5,
                                    minWidth: "32px",
                                    textAlign: "center",
                                    borderRadius: 2,
                                    fontWeight: 600,

                                    transition: "all 0.2s",

                                    "&:hover": {
                                      backgroundColor: "primary.main",
                                      color: "white",
                                      transform: "scale(1.05)",
                                    },
                                  }}
                                >
                                  {valor === "" ? "-" : valor}
                                </Box>
                              )}
                            </TableCell>
                          );
                        })}

                        <TableCell align="center">{definitiva}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
      {alert && (
        <AlertDemo
          duration={2000}
          action={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
    </>
  );
}
