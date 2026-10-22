import "dotenv/config";
import express, { json } from "express";
import { estudianteRouter } from "./routes/estudianteRoutes.js";
import { añosEscolaresRouter } from "./routes/añosEscolaresRoutes.js";
import { relacionEstudianteGradosRouter } from "./routes/relacionEstudianteGrados.js";
import { profesoresRouter } from "./routes/profesoresRoutes.js";
import { asignaturasRouter } from "./routes/asignaturas.js";
import { relacionGradoAsignaturaRouter } from "./routes/relacionGradoAsignatura.js";
import { relacionAsignaturaProfesorRouter } from "./routes/relacionAsignaturaProfesor.js";
import cors from "cors";
import { relProfesorAsignaturaRouter } from "./routes/asignaturaProfesorTemplateRoute.js";
import { signoutRouter } from "./routes/signout.js";
import { userRoutes } from "./routes/userRoutes.js";
import { relacionEstudianteRepresentanteRouter } from "./routes/relacionEstudianteRepresentanteRoute.js";
import { representanteRouter } from "./routes/representantesRoutes.js";
import { anioAsignaturaTemplateRouter } from "./routes/anioAsignaturaTemplateRoute.js";
import { administradoresRouter } from "./routes/administradoresRoute.js";
import { estudianteNotasRoutes } from "./routes/estudiantesNotasRoutes.js";
import { profesorNotaRoutes } from "./routes/ProfesorNotasRoutes.js";
import { Promociones } from "./routes/promocionesRoutes.js";
import { periodoRouter } from "./routes/periodoRoutes.js";
import { finalizacionRouter } from "./routes/finalizacionRoutes.js";
import { revisionRouter } from "./routes/revisionRoutes.js";
import { pendienteRouter } from "./routes/pendienteRoutes.js";
import { planillaRouter } from "./routes/planillaRoutes.js";
import { telegramRouter } from "./routes/telegramRoutes.js";
import { authenticate, authorize } from "./src/middleware/auth.js";
import { TelegramService } from "./services/telegramService.js";
const app = express();
app.use(json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));

// Cambio: middleware comun para rutas administrativas sensibles.
const soloAdmin = [authenticate, authorize(["admin"])];

app.use("/api/users", userRoutes);
app.use(
  "/relacion_estudiante_representantes",
  ...soloAdmin,
  relacionEstudianteRepresentanteRouter,
);
app.use("/representantes", ...soloAdmin, representanteRouter);
app.use("/api/signout", authenticate, signoutRouter);
app.use("/administradores", ...soloAdmin, administradoresRouter);
app.use("/estudiantes", estudianteNotasRoutes); //quitar si da problemas con estudiantes generico en admin
app.use("/estudiantes", ...soloAdmin, estudianteRouter);
app.use("/grado", ...soloAdmin, añosEscolaresRouter);
app.use(
  "/relacion_estudiante_grados",
  ...soloAdmin,
  relacionEstudianteGradosRouter,
);
app.use("/profesor", profesorNotaRoutes);
app.use("/profesores", ...soloAdmin, profesoresRouter);
app.use("/asignaturas", ...soloAdmin, asignaturasRouter);
app.use("/relacion_grado_asignatura", ...soloAdmin, relacionGradoAsignaturaRouter);
app.use(
  "/relacion_asignatura_profesor",
  ...soloAdmin,
  relacionAsignaturaProfesorRouter,
);
app.use("/anio_asignatura_template", ...soloAdmin, anioAsignaturaTemplateRouter);
app.use(
  "/asignatura_profesor_template",
  ...soloAdmin,
  relProfesorAsignaturaRouter,
);
app.use("/promociones", ...soloAdmin, Promociones);
app.use("/periodos", periodoRouter);
// Cambio: ruta oficial singular para finalizacion.
app.use("/finalizacion", ...soloAdmin, finalizacionRouter);
app.use("/finalizaciones", ...soloAdmin, finalizacionRouter);
app.use("/revision", revisionRouter);
app.use("/pendientes", pendienteRouter);
app.use("/planilla", ...soloAdmin, planillaRouter);
app.use("/telegram", telegramRouter);

// Cambio: inicializa Telegram en polling local si TELEGRAM_BOT_TOKEN existe.
TelegramService.iniciarBot();

const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`Servidor disponible en http://localhost:${PORT}`);
});
