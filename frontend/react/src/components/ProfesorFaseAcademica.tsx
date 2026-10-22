import { useEffect, useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { PlanillaFasePendiente } from "@/api/planilla";
import { obtenerPeriodos, type PeriodoEscolar } from "@/api/periodos";
import {
  obtenerEstudiantesRevisionProfesor,
  registrarNotaRevisionProfesor,
  type EstudianteRevision,
  type MateriaRevision,
} from "@/api/revision";
import {
  obtenerEstudiantesPendientesProfesor,
  registrarNotaPendienteProfesor,
  type EstudiantePendiente,
  type MateriaPendiente,
} from "@/api/pendientes";

type ProfesorFaseMode = "revision" | "pendiente";
type EstudianteFase = EstudianteRevision | EstudiantePendiente;
type MateriaFase = MateriaRevision | MateriaPendiente;

type GradoResumen = {
  id: number;
  anio: number;
  seccion: string;
  total: number;
};

type ProfesorFaseAcademicaProps = {
  mode: ProfesorFaseMode;
};

const FASES_PENDIENTE: Array<{
  value: PlanillaFasePendiente;
  label: string;
}> = [
  { value: "pendiente_oct", label: "Octubre" },
  { value: "pendiente_dic", label: "Diciembre" },
  { value: "pendiente_ene", label: "Enero" },
  { value: "pendiente_jun", label: "Junio" },
];

const TITULOS: Record<ProfesorFaseMode, string> = {
  revision: "Notas de Revision",
  pendiente: "Notas de Materias Pendientes",
};

export default function ProfesorFaseAcademica({
  mode,
}: ProfesorFaseAcademicaProps) {
  const [periodos, setPeriodos] = useState<PeriodoEscolar[]>([]);
  const [periodoId, setPeriodoId] = useState<number | "">("");
  const [fase, setFase] = useState<PlanillaFasePendiente>("pendiente_oct");
  const [rows, setRows] = useState<EstudianteFase[]>([]);
  const [gradoId, setGradoId] = useState<number | "">("");
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPeriodos();
  }, []);

  useEffect(() => {
    if (!periodoId) return;
    cargarEstudiantes();
  }, [periodoId, mode, fase]);

  const grados = useMemo(() => {
    const agrupados = new Map<number, GradoResumen>();

    rows.forEach((row) => {
      const actual = agrupados.get(row.id_grado);
      if (actual) {
        actual.total += 1;
        return;
      }

      // Cambio: el profesor ve solo los grupos U donde tiene materias asignadas.
      agrupados.set(row.id_grado, {
        id: row.id_grado,
        anio: row.anio,
        seccion: row.seccion,
        total: 1,
      });
    });

    return Array.from(agrupados.values()).sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio;
      return a.seccion.localeCompare(b.seccion);
    });
  }, [rows]);

  useEffect(() => {
    if (grados.length === 0) {
      setGradoId("");
      return;
    }

    if (!gradoId || !grados.some((grado) => grado.id === gradoId)) {
      setGradoId(grados[0].id);
    }
  }, [gradoId, grados]);

  const rowsVisibles = useMemo(() => {
    if (!gradoId) return [];
    return rows.filter((row) => row.id_grado === gradoId);
  }, [gradoId, rows]);

  async function cargarPeriodos() {
    setLoading(true);
    setError("");
    try {
      const data = await obtenerPeriodos();
      setPeriodos(data);
      const activo = data.find((periodo) => periodo.activo === 1);
      setPeriodoId((activo ?? data[0])?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_PERIODOS");
    } finally {
      setLoading(false);
    }
  }

  async function cargarEstudiantes() {
    if (!periodoId) return;
    setLoading(true);
    setError("");
    try {
      const data =
        mode === "revision"
          ? await obtenerEstudiantesRevisionProfesor(Number(periodoId))
          : await obtenerEstudiantesPendientesProfesor(Number(periodoId), fase);
      setRows(data);
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "ERROR_ESTUDIANTES");
    } finally {
      setLoading(false);
    }
  }

  async function guardarNota(materia: MateriaFase) {
    const value = notas[materia.id];
    if (value === undefined || value === "") return;

    setLoading(true);
    setMensaje("");
    setError("");
    try {
      const nota: number | "IN" = value.trim().toUpperCase() === "IN" ? "IN" : Number(value);
      if (nota !== "IN" && (Number.isNaN(nota) || nota < 0 || nota > 20)) {
        setError("Valor inválido. Debe ser un número entre 0 y 20, o IN");
        return;
      }
      if (mode === "revision") {
        await registrarNotaRevisionProfesor(materia.id, nota);
      } else {
        await registrarNotaPendienteProfesor(materia.id, nota, fase);
      }
      // Cambio: mantiene el ajuste manual de nota dentro de cada fase.
      setNotas((current) => ({ ...current, [materia.id]: "" }));
      setMensaje("Nota guardada correctamente.");
      await cargarEstudiantes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_NOTA");
    } finally {
      setLoading(false);
    }
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
            Gestiona solo las materias asignadas a tu usuario.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              label="Periodo"
              value={periodoId}
              onChange={(event) => setPeriodoId(Number(event.target.value))}
              disabled={periodos.length === 0}
            >
              {periodos.map((periodo) => (
                <MenuItem key={periodo.id} value={periodo.id}>
                  {periodo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {mode === "pendiente" ? (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Fase</InputLabel>
              <Select
                label="Fase"
                value={fase}
                onChange={(event) =>
                  setFase(event.target.value as PlanillaFasePendiente)
                }
              >
                {FASES_PENDIENTE.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}
        </Stack>
      </Stack>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {mensaje ? <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert> : null}

      {grados.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 2,
            mb: 3,
          }}
        >
          {grados.map((grado) => (
            <Card
              key={grado.id}
              sx={{
                border: "1px solid",
                borderColor: gradoId === grado.id ? "primary.main" : "divider",
                boxShadow: gradoId === grado.id ? 3 : 0,
              }}
            >
              <CardActionArea onClick={() => setGradoId(grado.id)}>
                <CardContent sx={{ textAlign: "center", py: 2.5 }}>
                  <Typography variant="h4" fontWeight={800} color="primary">
                    {grado.anio}
                    {grado.seccion}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seccion unica
                  </Typography>
                  <Chip
                    size="small"
                    sx={{ display: "flex", mt: 1, mx: "auto", width: "fit-content" }}
                    label={`${grado.total} estudiantes`}
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          {loading ? "Cargando..." : "No hay materias para evaluar en esta fase."}
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Estudiante</TableCell>
            <TableCell>Cedula</TableCell>
            <TableCell>Estado</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rowsVisibles.map((estudiante) => (
            <TableRow key={estudiante.id_estudiante} hover>
              <TableCell>
                {estudiante.apellido} {estudiante.nombre}
              </TableCell>
              <TableCell>{estudiante.cedula}</TableCell>
              <TableCell>
                <Stack spacing={1}>
                  <Chip size="small" label={estudiante.estado ?? "Por evaluar"} />
                  {estudiante.materias.map((materia) => (
                    <Stack
                      key={materia.id}
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "center" }}
                    >
                      <Chip
                        size="small"
                        label={`${materia.asignatura}: ${
                          materia.inasistente
                            ? "IN"
                            : (materia.nota_obtenida ?? "Sin nota")
                        }`}
                      />
                      <TextField
                        size="small"
                        label="Nota o IN"
                        value={notas[materia.id] ?? ""}
                        disabled={loading}
                        onChange={(event) =>
                          setNotas((current) => ({
                            ...current,
                            [materia.id]: event.target.value,
                          }))
                        }
                        inputProps={{ maxLength: 5 }}
                        sx={{ width: 96 }}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={loading || !notas[materia.id]}
                        onClick={() => guardarNota(materia)}
                      >
                        Guardar
                      </Button>
                    </Stack>
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
          {rowsVisibles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3}>
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
