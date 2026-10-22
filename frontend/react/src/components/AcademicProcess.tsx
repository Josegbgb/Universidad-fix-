import { useEffect, useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
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
import PrintIcon from "@mui/icons-material/Print";
import LockIcon from "@mui/icons-material/Lock";
import DoneIcon from "@mui/icons-material/Done";
import AddIcon from "@mui/icons-material/Add";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import type { Grados } from "@/interfaces/interface";
import { obtenerGrados } from "@/api/grados";
import Snackbar from "@mui/material/Snackbar";
import {
  activarPeriodo,
  cerrarRevisionPeriodo,
  crearPeriodo,
  obtenerPeriodos,
  obtenerResumenPeriodo,
  type FasePeriodo,
  type PeriodoEscolar,
  type PeriodoResumen,
  type abrirRevisionEspecial,
} from "@/api/periodos";
import {
  cerrarFinalizacion,
  obtenerEstudiantesFinalizacion,
  type EstudianteFinalizacion,
} from "@/api/finalizacion";
import {
  obtenerEstudiantesRevision,
  registrarNotaRevision,
  type EstudianteRevision,
  type MateriaRevision,
} from "@/api/revision";
import {
  cerrarFasePendiente,
  obtenerEstudiantesPendientes,
  registrarNotaPendiente,
  type EstudiantePendiente,
  type MateriaPendiente,
} from "@/api/pendientes";
import type { PlanillaFasePendiente } from "@/api/planilla";
import {
  exportarPlanillaPeriodo,
  getMensajeErrorExportacion,
} from "@/utils/periodReportExport";

type AcademicMode = "finalizacion" | "revision" | "pendiente";

type AcademicProcessProps = {
  mode: AcademicMode;
  hideTitle?: boolean;
  allowPeriodCreation?: boolean;
  refreshKey?: number; // Cambio: fuerza recarga de grados
  children?: ReactNode;
};

type EstudianteAcademico =
  | EstudianteFinalizacion
  | EstudianteRevision
  | EstudiantePendiente;

type GradoTrabajo = Pick<Grados, "id" | "anio" | "seccion"> & {
  total?: number;
};

const PENDIENTE_FASES: Array<{
  value: PlanillaFasePendiente;
  label: string;
}> = [
  { value: "pendiente_oct", label: "Octubre" },
  { value: "pendiente_dic", label: "Diciembre" },
  { value: "pendiente_ene", label: "Enero" },
  { value: "pendiente_jun", label: "Junio" },
];

const TITULOS: Record<AcademicMode, string> = {
  finalizacion: "Finalizacion",
  revision: "Revision",
  pendiente: "Materias Pendientes",
};

function sugerirNombrePeriodo() {
  const hoy = new Date();
  const inicio =
    hoy.getMonth() + 1 >= 10 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return `${inicio}-${inicio + 1}`;
}

function nombreDesdeFechas(fecha_inicio: string, fecha_fin: string) {
  const anioInicio = fecha_inicio.slice(0, 4);
  const anioFin = fecha_fin.slice(0, 4);
  if (anioInicio && anioFin) return `${anioInicio}-${anioFin}`;
  if (anioInicio) return `${anioInicio}-${Number(anioInicio) + 1}`;
  return sugerirNombrePeriodo();
}

function ordenarGrados(a: GradoTrabajo, b: GradoTrabajo) {
  if (a.anio !== b.anio) return a.anio - b.anio;
  return a.seccion.localeCompare(b.seccion);
}

export default function AcademicProcess({
  mode,
  hideTitle = false,
  allowPeriodCreation = false,
  refreshKey = 0,
  children,
}: AcademicProcessProps) {
  const [periodos, setPeriodos] = useState<PeriodoEscolar[]>([]);
  const [periodoId, setPeriodoId] = useState<number | "">("");
  const [resumen, setResumen] = useState<PeriodoResumen | null>(null);
  const [grados, setGrados] = useState<Grados[]>([]);
  const [gradoId, setGradoId] = useState<number | "">("");
  const [fasePendiente, setFasePendiente] =
    useState<PlanillaFasePendiente>("pendiente_oct");
  const [rows, setRows] = useState<EstudianteAcademico[]>([]);
  const [notas, setNotas] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [errorNota, setErrorNota] = useState("");
  const [nuevoPeriodo, setNuevoPeriodo] = useState({
    nombre: sugerirNombrePeriodo(),
    fecha_inicio: "",
    fecha_fin: "",
  });

  useEffect(() => {
    cargarBase();
  }, []);

  useEffect(() => {
    if (!periodoId) return;
    cargarResumen(Number(periodoId));
  }, [periodoId]);

  useEffect(() => {
    if (!periodoId) return;
    cargarTrabajo();
  }, [periodoId, mode, fasePendiente]);
    // Cambio: recarga los grados cuando se crea, elimina, habilita o deshabilita uno
  useEffect(() => {
    if (refreshKey === 0) return;
    obtenerGrados()
      .then(setGrados)
      .catch(() => {});
  }, [refreshKey]);

  const gradosDisponibles = useMemo<GradoTrabajo[]>(() => {
    if (mode === "finalizacion") {
      return grados
        .filter((grado) => grado.seccion !== "U")
        .sort(ordenarGrados);
    }

    const agrupados = new Map<number, GradoTrabajo>();
    rows.forEach((estudiante) => {
      const actual = agrupados.get(estudiante.id_grado);
      if (actual) {
        actual.total = (actual.total ?? 0) + 1;
        return;
      }

      // Cambio: Revision/Pendientes solo muestran secciones U con estudiantes.
      agrupados.set(estudiante.id_grado, {
        id: estudiante.id_grado,
        anio: estudiante.anio,
        seccion: estudiante.seccion,
        total: 1,
      });
    });

    return Array.from(agrupados.values()).sort(ordenarGrados);
  }, [grados, mode, rows]);

  const rowsVisibles = useMemo(() => {
    if (!gradoId) return [];
    return rows.filter((estudiante) => estudiante.id_grado === gradoId);
  }, [gradoId, rows]);

  useEffect(() => {
    if (gradosDisponibles.length === 0) {
      setGradoId("");
      return;
    }

    if (!gradoId || !gradosDisponibles.some((grado) => grado.id === gradoId)) {
      setGradoId(gradosDisponibles[0].id);
    }
  }, [gradosDisponibles, gradoId]);

  useEffect(() => {
    if (!mensaje) return;
    const timer = setTimeout(() => setMensaje(""), 4000);
    return () => clearTimeout(timer);
  }, [mensaje]);

  const faseActual = useMemo(() => {
  const fase = mode === "pendiente" ? fasePendiente : mode;
    // Cambio: si la revision especial esta abierta, es la fase vigente de revision.
    if (mode === "revision") {
      const especial = resumen?.fases.find(
        (item: FasePeriodo) => item.fase === "revision_especial",
      );
      if (especial?.abierta) return especial;
    }
    return resumen?.fases.find((item: FasePeriodo) => item.fase === fase);
  }, [fasePendiente, mode, resumen]);

  const periodoSeleccionado = useMemo(
    () => periodos.find((periodo) => periodo.id === Number(periodoId)),
    [periodoId, periodos],
  );
  const hayPeriodoActivo = periodos.some((periodo) => periodo.activo === 1);
  const faseAbierta = Boolean(faseActual?.abierta);
    const especialFase = resumen?.fases.find(
    (item: FasePeriodo) => item.fase === "revision_especial",
  );
  const revisionEspecialAbierta =
    mode === "revision" && Boolean(especialFase?.abierta);
  const puedeAbrirEspecial =
    mode === "revision" &&
    Boolean(
      resumen?.fases.find((item: FasePeriodo) => item.fase === "revision")
        ?.abierta,
    ) &&
    Boolean(especialFase) &&
    !especialFase?.abierta &&
    !especialFase?.cerrada_at;

  async function cargarBase() {
    setError("");
    setLoading(true);
    try {
      const [periodosData, gradosData] = await Promise.all([
        obtenerPeriodos(),
        obtenerGrados(),
      ]);
      setPeriodos(periodosData);
      setGrados(gradosData);

      const activo = periodosData.find((periodo) => periodo.activo === 1);
      setPeriodoId((activo ?? periodosData[0])?.id ?? "");
    } catch (err) {
      // Cambio: muestra errores de periodo/auth sin romper el modulo.
      setError(err instanceof Error ? err.message : "ERROR_CARGA_BASE");
    } finally {
      setLoading(false);
    }
  }

  async function crearPeriodoInicial() {
    setLoading(true);
    setMensaje("");
    setError("");
    try {
      // Cambio: crea el periodo manual inicial desde el flujo normal.
      await crearPeriodo({
        nombre: nuevoPeriodo.nombre.trim(),
        fecha_inicio: nuevoPeriodo.fecha_inicio || undefined,
        fecha_fin: nuevoPeriodo.fecha_fin || undefined,
      });
      setMensaje("Periodo escolar creado y activado correctamente.");
      await cargarBase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_CREAR_PERIODO");
    } finally {
      setLoading(false);
    }
  }

  async function activarPeriodoActual() {
    if (!periodoId) return;
    setLoading(true);
    setMensaje("");
    setError("");
    try {
      // Cambio: reactiva periodos no cerrados cuando no hay periodo activo.
      await activarPeriodo(Number(periodoId));
      setMensaje("Periodo escolar activado correctamente.");
      await cargarBase();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_ACTIVAR_PERIODO");
    } finally {
      setLoading(false);
    }
  }

  async function cargarResumen(idPeriodo: number) {
    try {
      setResumen(await obtenerResumenPeriodo(idPeriodo));
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_RESUMEN");
    }
  }

  async function cargarTrabajo() {
    if (!periodoId) return;
    setLoading(true);
    setError("");
    try {
      const id = Number(periodoId);
      if (mode === "finalizacion") {
        setRows(await obtenerEstudiantesFinalizacion(id));
      }
      if (mode === "revision") {
        setRows(await obtenerEstudiantesRevision(id));
      }
      if (mode === "pendiente") {
        setRows(await obtenerEstudiantesPendientes(id, fasePendiente));
      }
    } catch (err) {
      setRows([]);
      setError(err instanceof Error ? err.message : "ERROR_CARGA");
    } finally {
      setLoading(false);
    }
  }

  async function cerrarPeriodo() {
    if (!periodoId) return;
    setLoading(true);
    setMensaje("");
    setError("");
    try {
      if (mode === "finalizacion") await cerrarFinalizacion(Number(periodoId));
      if (mode === "revision") await cerrarRevisionPeriodo(Number(periodoId));
      if (mode === "pendiente") {
        await cerrarFasePendiente(Number(periodoId), fasePendiente);
      }
      await cargarResumen(Number(periodoId));
      setMensaje("Periodo cerrado correctamente.");
      await cargarBase();
      await cargarTrabajo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_CIERRE");
    } finally {
      setLoading(false);
    }
  }

  async function abrirEspecial() {
    if (!periodoId) return;
    if (
      !window.confirm(
        "¿Abrir la revisión especial? La revisión normal quedará cerrada y solo podrán editarse las materias sin aprobar.",
      )
    ) {
      return;
    }
    setLoading(true);
    setMensaje("");
    setError("");
    try {
      await abrirRevisionEspecial(Number(periodoId));
      await cargarResumen(Number(periodoId));
      setMensaje("Revisión especial abierta correctamente.");
      await cargarTrabajo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_REVISION_ESPECIAL");
    } finally {
      setLoading(false);
    }
  }

  function cancelarEdicion(id: number) {
    setNotas((actual) => {
      const copia = { ...actual };
      delete copia[id];
      return copia;
    });
  }

  async function guardarNota(materia: MateriaRevision | MateriaPendiente) {
    const value = notas[materia.id];
    if (value === undefined) return;

    if (value === "") {
      cancelarEdicion(materia.id);
      return;
    }

          // Cambio: acepta "IN" (inasistente) además de notas de 0 a 20.
    const nota: number | "IN" =
      value.trim().toUpperCase() === "IN" ? "IN" : Number(value);
    if (nota !== "IN" && (Number.isNaN(nota) || nota < 0 || nota > 20)) {
      setErrorNota("Valor inválido. Debe ser un número entre 0 y 20, o IN");
      cancelarEdicion(materia.id);
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (mode === "revision") await registrarNotaRevision(materia.id, nota);
      if (mode === "pendiente") {
        await registrarNotaPendiente(materia.id, nota, fasePendiente);
      }
      cancelarEdicion(materia.id);
      await cargarTrabajo();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ERROR_NOTA");
      cancelarEdicion(materia.id);
    } finally {
      setLoading(false);
    }
  }

  async function exportar() {
    if (!periodoId || !gradoId) return;
    setError("");

    try {
      // Cambio: exporta historicos y fases actuales usando la plantilla oficial.
      if (mode === "pendiente") {
        await exportarPlanillaPeriodo({
          tipo: "pendiente",
          idPeriodo: Number(periodoId),
          idGrado: Number(gradoId),
          fase: fasePendiente,
        });
        return;
      }

      await exportarPlanillaPeriodo({
        tipo: mode,
        idPeriodo: Number(periodoId),
        idGrado: Number(gradoId),
      });
    } catch (err) {
      setError(getMensajeErrorExportacion(err));
    }
  }

  return (
    <Box>
      {mode !== "finalizacion" ? renderGradoCards() : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          {hideTitle ? (
            <Typography variant="subtitle1" fontWeight={700}>
              Cierre y exportacion
            </Typography>
          ) : (
            <Typography variant="h5" fontWeight={700}>
              {TITULOS[mode]}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip
              size="small"
              color={faseAbierta ? "success" : "default"}
              icon={
                faseAbierta ? (
                  <DoneIcon />
                ) : faseActual && !faseActual.cerrada_at ? (
                  <InfoOutlinedIcon />
                ) : (
                  <LockIcon />
                )
              }
              label={
                faseAbierta
                  ? "Abierto"
                  : faseActual && !faseActual.cerrada_at
                  ? "Sin estudiantes"
                  : "Cerrado"
              }
            />
            {resumen?.cerrado ? <Chip size="small" label="Historico" /> : null}
            {revisionEspecialAbierta ? (
              <Chip size="small" color="warning" label="Revisión especial" />
            ) : null}
          </Stack>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <FormControl
            size="small"
            sx={{ minWidth: 150 }}
            disabled={periodos.length === 0}
          >
            <InputLabel>Periodo</InputLabel>
            <Select
              label="Periodo"
              value={periodoId}
              onChange={(event) => setPeriodoId(Number(event.target.value))}
            >
              {periodos.map((periodo) => (
                <MenuItem key={periodo.id} value={periodo.id}>
                  {periodo.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!hayPeriodoActivo && periodoSeleccionado?.cerrado === 0 ? (
            <Button
              variant="outlined"
              startIcon={<PowerSettingsNewIcon />}
              disabled={loading}
              onClick={activarPeriodoActual}
            >
              Activar
            </Button>
          ) : null}

          {mode === "pendiente" ? (
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Fase</InputLabel>
              <Select
                label="Fase"
                value={fasePendiente}
                onChange={(event) =>
                  setFasePendiente(event.target.value as PlanillaFasePendiente)
                }
              >
                {PENDIENTE_FASES.map((fase) => (
                  <MenuItem key={fase.value} value={fase.value}>
                    {fase.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : null}

          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Grado</InputLabel>
            <Select
              label="Grado"
              value={gradoId}
              onChange={(event) => setGradoId(Number(event.target.value))}
            >
              {gradosDisponibles.map((grado) => (
                <MenuItem key={grado.id} value={grado.id}>
                  {grado.anio}
                  {grado.seccion}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<PrintIcon />}
            disabled={!periodoId || !gradoId}
            onClick={exportar}
          >
            Exportar
          </Button>
          {puedeAbrirEspecial ? (
            <Button
              variant="outlined"
              color="warning"
              disabled={loading}
              onClick={abrirEspecial}
            >
              Revisión especial
            </Button>
          ) : null}
          <Button
            variant="contained"
            color="primary"
            disabled={!periodoId || !faseAbierta || loading}
            onClick={cerrarPeriodo}
          >
            Cerrar Periodo
          </Button>
        </Stack>
      </Stack>

      {periodos.length === 0 && allowPeriodCreation ? (
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: "1px solid",
            borderColor: "warning.light",
            borderRadius: 1,
            bgcolor: "background.paper",
          }}
        >
          <Alert severity="warning" sx={{ mb: 2 }}>
            Debe crear un periodo escolar activo antes de continuar.
          </Alert>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              size="small"
              label="Periodo escolar"
              value={nuevoPeriodo.nombre}
              InputProps={{ readOnly: true }}
              helperText="Se genera con las fechas"
            />
            <TextField
              size="small"
              type="date"
              label="Fecha inicio"
              value={nuevoPeriodo.fecha_inicio}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => {
                const fecha_inicio = event.target.value;
                setNuevoPeriodo((current) => ({
                  ...current,
                  fecha_inicio,
                  nombre: nombreDesdeFechas(fecha_inicio, current.fecha_fin),
                }));
              }}
            />
            <TextField
              size="small"
              type="date"
              label="Fecha fin"
              value={nuevoPeriodo.fecha_fin}
              InputLabelProps={{ shrink: true }}
              onChange={(event) => {
                const fecha_fin = event.target.value;
                setNuevoPeriodo((current) => ({
                  ...current,
                  fecha_fin,
                  nombre: nombreDesdeFechas(current.fecha_inicio, fecha_fin),
                }));
              }}
            />
            <Button
            style={{ maxHeight: 40 }}
              variant="contained"
              startIcon={<AddIcon />}
              disabled={loading || !nuevoPeriodo.nombre.trim()}
              onClick={crearPeriodoInicial}
            >
              Crear periodo
            </Button>
          </Stack>
        </Box>
      ) : null}

      {periodos.length === 0 && !allowPeriodCreation ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Debe crear el periodo escolar desde el modulo de Grados antes de usar
          esta fase.
        </Alert>
      ) : null}

      {periodos.length > 0 && !hayPeriodoActivo ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Debe activar un periodo escolar no cerrado antes de continuar.
        </Alert>
      ) : null}

      {mensaje ? (
        <Typography color="success.main" sx={{ mb: 1 }}>
          {mensaje}
        </Typography>
      ) : null}
      {error ? (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      ) : null}

      {children}

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
                  <Chip size="small" label={estadoEstudiante(estudiante)} />
                  {renderMaterias(estudiante)}
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
      <Snackbar
        open={Boolean(errorNota)}
        autoHideDuration={3000}
        onClose={() => setErrorNota("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          variant="outlined"
          sx={{ width: "100%", bgcolor: "background.paper" }}
        >
          {errorNota}
        </Alert>
      </Snackbar>
    </Box>
  );

  function renderGradoCards() {
    if (gradosDisponibles.length === 0) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          No hay estudiantes registrados para esta fase en el periodo
          seleccionado.
        </Alert>
      );
    }

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
          gap: 2,
          mb: 3,
        }}
      ></Box>
    );
  }

  function estadoEstudiante(estudiante: EstudianteAcademico) {
    if ("estado" in estudiante && estudiante.estado) return estudiante.estado;
    if (!("materias" in estudiante)) return "Por evaluar";
    if (estudiante.materias.length === 0) return "Sin materias pendientes";
    return mode === "revision" ? "En revision" : "Con materias pendientes";
  }

  function renderMaterias(estudiante: EstudianteAcademico) {
    if (!("materias" in estudiante)) return null;
    if (estudiante.materias.length === 0) return null;

    return (
      <Stack spacing={1}>
        {estudiante.materias.map((materia) => {
            const notaGuardada = materia.inasistente
            ? "IN"
            : String(materia.nota_obtenida ?? "");
          return (
            <Stack
              key={materia.id}
              direction="row"
              spacing={2}
              alignItems="center"
            >
              <Typography
                variant="subtitle1"
                fontWeight={700}
                sx={{ minWidth: 140 }}
              >
                {materia.asignatura}
              </Typography>
              <TextField
                size="small"
                placeholder="Nota o IN"
                value={notas[materia.id] ?? notaGuardada}
                disabled={
                  !faseAbierta ||
                  (revisionEspecialAbierta && Boolean(materia.aprobada))
                }
                onChange={(event) =>
                  setNotas((current) => ({
                    ...current,
                    [materia.id]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    guardarNota(materia);
                  }
                }}
                onBlur={() => cancelarEdicion(materia.id)}
                inputProps={{ maxLength: 5, style: { textAlign: "center" } }}
                sx={{ width: 100 }}
              />
            </Stack>
          );
        })}
      </Stack>
    );
  }
}
