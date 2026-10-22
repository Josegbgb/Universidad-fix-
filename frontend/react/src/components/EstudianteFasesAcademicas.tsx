import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { PlanillaFasePendiente } from "@/api/planilla";
import {
  obtenerMisRevisiones,
  type RevisionEstudiante,
} from "@/api/revision";
import {
  obtenerMisPendientes,
  type PendienteEstudiante,
} from "@/api/pendientes";

type EstudianteFaseMode = "revision" | "pendiente";
type RowFase = RevisionEstudiante | PendienteEstudiante;

type EstudianteFasesAcademicasProps = {
  mode: EstudianteFaseMode;
};

const TITULOS: Record<EstudianteFaseMode, string> = {
  revision: "Mi Revision",
  pendiente: "Mis Materias Pendientes",
};

const FASE_LABEL: Record<PlanillaFasePendiente, string> = {
  pendiente_oct: "Octubre",
  pendiente_dic: "Diciembre",
  pendiente_ene: "Enero",
  pendiente_jun: "Junio",
};

export default function EstudianteFasesAcademicas({
  mode,
}: EstudianteFasesAcademicasProps) {
  const [rows, setRows] = useState<RowFase[]>([]);
  const [periodo, setPeriodo] = useState<string>("todos");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, [mode]);

  const periodos = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.periodo))).sort().reverse();
  }, [rows]);

  const rowsVisibles = useMemo(() => {
    if (periodo === "todos") return rows;
    return rows.filter((row) => row.periodo === periodo);
  }, [periodo, rows]);

  async function cargar() {
    setLoading(true);
    setError("");
    try {
      // Cambio: cada fase del estudiante se consulta en su endpoint dedicado.
      const data =
        mode === "revision" ? await obtenerMisRevisiones() : await obtenerMisPendientes();
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "ERROR_FASE_ESTUDIANTE");
    } finally {
      setLoading(false);
    }
  }

  function estado(row: RowFase) {
    if (row.inasistente) return "Inasistente";
    if (row.nota_obtenida === null || row.nota_obtenida === undefined) {
      return "Sin nota";
    }
    return row.aprobada ? "Aprobada" : "No aprobada";
  }

  function faseLabel(row: RowFase) {
    if (!("fase" in row)) return "Revision";
    return FASE_LABEL[row.fase] ?? row.fase;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 3, pb: 2, borderBottom: "2px solid", borderColor: "divider" }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {TITULOS[mode]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consulta tus procesos academicos separados del historial de lapsos.
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Periodo</InputLabel>
          <Select
            label="Periodo"
            value={periodo}
            onChange={(event) => setPeriodo(String(event.target.value))}
          >
            <MenuItem value="todos">Todos</MenuItem>
            {periodos.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Periodo</TableCell>
            <TableCell>Grado</TableCell>
            <TableCell>Fase</TableCell>
            <TableCell>Asignatura</TableCell>
            <TableCell>Nota</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rowsVisibles.map((row, index) => (
            <TableRow key={`${row.periodo}-${row.asignatura}-${index}`} hover>
              <TableCell>{row.periodo}</TableCell>
              <TableCell>
                {row.anio ?? "-"}
                {row.seccion ?? ""}
              </TableCell>
              <TableCell>{faseLabel(row)}</TableCell>
              <TableCell>{row.asignatura}</TableCell>
              <TableCell>{row.inasistente ? "IN" : (row.nota_obtenida ?? "-")}</TableCell>
              <TableCell>
                <Chip size="small" label={estado(row)} />
              </TableCell>
            </TableRow>
          ))}
          {rowsVisibles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6}>
                <Typography color="text.secondary" textAlign="center">
                  {loading ? "Cargando..." : "Sin registros"}
                </Typography>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </Box>
  );
}
