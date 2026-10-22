// schecomponents/DashboardLayoutBranding.tsx
import { GlobalStyles } from "@mui/material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { createTheme } from "@mui/material/styles";

import LogoutIcon from "@mui/icons-material/Logout";
import { AppProvider, type Navigation } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import Reportes from "./Reportes";
import { useColorScheme } from "@mui/material/styles";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import ListasManejador, {
  AsignaturasList,
  GradosList,
  ProfesoresList,
} from "./ListasPages";
import { useEffect, useState } from "react";
import Administradores from "./Administradores";
import GestionarUsuarios from "./GestionarUsuarios";
import HistorialAcademico from "./EstudiantesMostrarNotas";
import SchoolIcon from "@mui/icons-material/School";
import BorderColorIcon from "@mui/icons-material/BorderColor";
import {
  ListasManejadorProfesores,
  ProfesorDashboard,
} from "./ProfesoresAsignarNotas";
import Groups2Icon from "@mui/icons-material/Groups2";
import PersonIcon from "@mui/icons-material/Person";
import ProfesorAsignatura from "./ProfesoresAsignatura";
import UserInfoCard from "./UserInfoCard";
import NoteIcon from "@mui/icons-material/Note";
import HistorialCompleto from "./HistorialNotasEstudiantes";
import EgresadosEstudiantes from "./Egresados";
import HistorialEstudianteAdmin from "./HistorialEstudianteAdmin";
import Papelera from "./Papelera";
import DeleteIcon from "@mui/icons-material/Delete";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import RuleIcon from "@mui/icons-material/Rule";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import Revision from "./Revision";
import MateriasPendientes from "./MateriasPendientes";
import ProfesorFaseAcademica from "./ProfesorFaseAcademica";
import EstudianteFasesAcademicas from "./EstudianteFasesAcademicas";

function UserNameOverlay({ userName }: { userName: string }) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 22,
        right: 100,
        zIndex: 9999,
      }}
    >
      <Typography style={{ fontWeight: "bold" }} color="#7abdf2">
        {userName || "Usuario"}
      </Typography>
    </Box>
  );
}

const AdminNavigation: Navigation = [
  {
    // Estas rutas deben coincidir con los <Route path="...">
    segment: "admin/dashboard/grados",
    title: "Grados",
    icon: <AutoStoriesIcon />,
  },
  {
    segment: "admin/dashboard/profesores",
    title: "Profesores",
    icon: <BorderColorIcon />,
  },
  {
    segment: "admin/dashboard/asignaturas",
    title: "Asignaturas",
    icon: <AssignmentIcon />,
  },
  {
    segment: "admin/dashboard/administradores",
    title: "Administradores",
    icon: <SupervisorAccountIcon />,
  },
  {
    segment: "admin/dashboard/usuarios",
    title: "Usuarios",
    icon: <Groups2Icon />,
  },
  {
    segment: "admin/dashboard/reportes",
    title: "Reportes",
    icon: <NoteIcon />,
  },
  {
    // Cambio: modulo administrativo de revision.
    segment: "admin/dashboard/revision",
    title: "Revision",
    icon: <RuleIcon />,
  },
  {
    // Cambio: modulo administrativo de materias pendientes.
    segment: "admin/dashboard/pendientes",
    title: "Materias Pendientes",
    icon: <PendingActionsIcon />,
  },

  {
    segment: "admin/dashboard/egresados",
    title: "Egresados",
    icon: <SchoolIcon />,
  },
  {
    segment: "admin/dashboard/papelera",
    title: "Papelera",
    icon: <DeleteIcon />,
  },
  {
    segment: "admin/dashboard/usuario",
    title: "Mi Usuario",
    icon: <PersonIcon />,
  },
  {
    segment: "admin/dashboard/logout",
    title: "Cerrar sesión",
    icon: <LogoutIcon />,
  },
];
const StudentNavigation: Navigation = [
  {
    segment: "estudiante/dashboard/historial",
    title: "Historial Academico",
    icon: <ManageSearchIcon />,
  },
  {
    // Cambio: estudiante consulta revision separada del historial normal.
    segment: "estudiante/dashboard/revision",
    title: "Revision",
    icon: <RuleIcon />,
  },
  {
    // Cambio: estudiante consulta materias pendientes por separado.
    segment: "estudiante/dashboard/pendientes",
    title: "Materias Pendientes",
    icon: <PendingActionsIcon />,
  },
  {
    segment: "estudiante/dashboard/usuario",
    title: "Mi Usuario",
    icon: <PersonIcon />,
  },
  {
    segment: "estudiante/dashboard/logout",
    title: "Cerrar sesión",
    icon: <LogoutIcon />,
  },
];

const ProfesoresNavigation: Navigation = [
  {
    segment: "profesor/dashboard",
    title: "Notas de Lapso",
    icon: <BorderColorIcon />,
  },
  {
    // Cambio: profesor registra revision en una vista independiente.
    segment: "profesor/dashboard/revision",
    title: "Revision",
    icon: <RuleIcon />,
  },
  {
    // Cambio: profesor registra pendientes en una vista independiente.
    segment: "profesor/dashboard/pendientes",
    title: "Materias Pendientes",
    icon: <PendingActionsIcon />,
  },
  {
    segment: "profesor/dashboard/usuario",
    title: "Mi Usuario",
    icon: <PersonIcon />,
  },
  {
    segment: "profesor/dashboard/logout",
    title: "Cerrar sesión",
    icon: <LogoutIcon />,
  },
];
export function SyncDarkMode() {
  const { mode } = useColorScheme();

  useEffect(() => {
    const isDark = mode === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, [mode]);

  return null;
}

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});

function DemoPageContent() {
  const location = useLocation();
  if (
    location.pathname === "/admin/dashboard" ||
    location.pathname === "/admin/dashboard/"
  ) {
    return <Navigate to="/admin/dashboard/grados" replace />;
  }
  return (
    <Box sx={{ p: 3 }}>
      <Routes>
        <Route
          path="grados/*"
          element={<ListasManejador mode={<GradosList />} />}
        />
        <Route path="reportes/*" element={<Reportes />} />
        <Route path="finalizacion/*" element={<Navigate to="/admin/dashboard/grados" replace />} />
        <Route path="revision/*" element={<Revision />} />
        <Route path="pendientes/*" element={<MateriasPendientes />} />
        <Route
          path="reportes/historial"
          element={<HistorialEstudianteAdmin />}
        />
        <Route
          path="profesores/*"
          element={<ListasManejador mode={<ProfesoresList />} />}
        />
        <Route
          path="asignaturas/*"
          element={<ListasManejador mode={<AsignaturasList />} />}
        />
        <Route
          path="usuarios/*"
          element={<ListasManejador mode={<GestionarUsuarios />} />}
        />
        <Route path="egresados/*" element={<EgresadosEstudiantes />} />
        <Route
          path="egresados/historial"
          element={<HistorialEstudianteAdmin />}
        />
        <Route
          path="administradores/*"
          element={<ListasManejador mode={<Administradores />} />}
        />
        {/* Ruta que realiza el logout y redirige */}
        <Route path="logout" element={<LogoutRoute />} />
        {/* Puedes ir agregando más rutas aquí */}
        <Route
          path="/"
          element={
            <Typography variant="h4" textAlign="center">
              Bienvenido al Dashboard
            </Typography>
          }
        />
        <Route
          path="papelera/*"
          element={<ListasManejador mode={<Papelera />} />}
        />

        <Route path="usuario" element={<UserInfoCard />} />
        <Route
          path="*"
          element={
            <Typography variant="h6" color="error" textAlign="center">
              Página no encontrada: {location.pathname}
            </Typography>
          }
        />
      </Routes>
    </Box>
  );
}

function DemoPageContentStudent() {
  return (
    <Box sx={{ p: 3 }}>
      <Routes>
        <Route index element={<HistorialAcademico />} />
        <Route path="usuario" element={<UserInfoCard />} />
        <Route path="historial" element={<HistorialCompleto />} />
        <Route
          path="revision"
          element={<EstudianteFasesAcademicas mode="revision" />}
        />
        <Route
          path="pendientes"
          element={<EstudianteFasesAcademicas mode="pendiente" />}
        />
        <Route path="logout" element={<LogoutRoute />} />
      </Routes>
    </Box>
  );
}

function DemoPageContentProfesores() {
  const location = useLocation();

  return (
    <Box sx={{ p: 3 }}>
      <Routes>
        <Route path="logout" element={<LogoutRoute />} />
        <Route path="usuario" element={<UserInfoCard />} />
        <Route
          path="revision"
          element={<ProfesorFaseAcademica mode="revision" />}
        />
        <Route
          path="pendientes"
          element={<ProfesorFaseAcademica mode="pendiente" />}
        />
        <Route path="anio/estudiantes/:id" element={<ProfesorAsignatura />} />
        <Route
          path="/*"
          element={<ListasManejadorProfesores mode={<ProfesorDashboard />} />}
        />
        <Route
          path="*"
          element={
            <Typography variant="h6" color="error" textAlign="center">
              Página no encontrada: {location.pathname}
            </Typography>
          }
        />
      </Routes>
    </Box>
  );
}

/**
 * Componente de la ruta /admin/dashboard/logout
 * ejecuta el logout (borra localStorage) y redirige a "/"
 */
function LogoutRoute() {
  const navigate = useNavigate();
  useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
    } catch (e) {
      // no romper si algo falla
      // console.warn(e);
    }
    // redirige al login (ruta pública "/")
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography>Cerrando sesión...</Typography>
    </Box>
  );
}
async function obtenerPerfilUsuario(email: string) {
  try {
    const res = await fetch(
      `http://localhost:1234/api/users/me?email=${email}`,
    );
    const data = await res.json();
    console.log("📡 RESPUESTA PERFIL:", data);
    return data;
  } catch (error) {
    return null;
  }
}
export default function DashboardLayoutBranding() {
  const [userName, setUserName] = useState<string>("");
  useEffect(() => {
    const email = localStorage.getItem("email");
    console.log("📩 EMAIL OBTENIDO EN DASHBOARD:", email);
    if (email) {
      console.log("📡 OBTENIENDO PERFIL PARA:", email);
      obtenerPerfilUsuario(email).then((perfil) => {
        console.log("📡 PERFIL OBTENIDO:", perfil);
        if (perfil?.body?.nombre) {
          setUserName(`${perfil.body.nombre} ${perfil.body.apellido}`);
        } else {
          setUserName(email.split("@")[0]);
        }
      });
    }
  }, []);
  console.log(userName);
  return (
    <AppProvider
      key={userName}
      navigation={AdminNavigation}
      branding={{
        logo: (
          <img
            src="/LOGO_LICEO.png"
            alt="logo"
            style={{ height: "130px", width: "80px" }}
          />
        ),
        title: "GRAN MARISCAL ANTONIO JOSE DE SUCRE",
        homeUrl: "/admin/dashboard/grados",
      }}
      session={{
        user: {
          name: userName || "Admin",
          email: localStorage.getItem("email") || "",
          image: "/LOGO_LICEO.png",
        },
      }}
      theme={demoTheme}
    >
      <SyncDarkMode />
      <GlobalStyles
        styles={{
          ".css-1y8nxit-MuiDrawer-docked .MuiDrawer-paper": {
            width: "200px !important", // cambia esto al ancho que desees
          },
          ".css-1y8nxit-MuiDrawer-docked": {
            width: "200px !important",
          },
          /* opcional: forzar que el último item del nav no se corte y tenga margen arriba,
             si quieres "pegado al bottom" absoluto habría que hacer reglas más específicas
             según la estructura DOM generada por @toolpad, pero esto ayuda visualmente. */
          ".tp-navigationList > li:last-child": {
            marginTop: "auto",
          },
          ".css-9z93tp img": {
            maxHeight: "140px !important", // 👈 agrega esto
          },
        }}
      />
      <DashboardLayout>
        <UserNameOverlay userName={userName} />
        <DemoPageContent />
      </DashboardLayout>
    </AppProvider>
  );
}

export function DashboardProfesor() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      obtenerPerfilUsuario(email).then((perfil) => {
        if (perfil?.body?.nombre) {
          setUserName(`${perfil.body.nombre} ${perfil.body.apellido}`);
        } else {
          setUserName(email.split("@")[0]);
        }
      });
    }
  }, []);
  return (
    <AppProvider
      navigation={ProfesoresNavigation}
      branding={{
        logo: (
          <img
            src="/LOGO_LICEO.png"
            alt="logo"
            style={{ height: "130px", width: "80px" }}
          />
        ),
        title: "GRAN MARISCAL ANTONIO JOSE DE SUCRE",
        homeUrl: "/profesor/dashboard/",
      }}
      theme={demoTheme}
    >
      <SyncDarkMode />
      <GlobalStyles
        styles={{
          ".css-1y8nxit-MuiDrawer-docked .MuiDrawer-paper": {
            width: "200px !important", // cambia esto al ancho que desees
          },
          ".css-1y8nxit-MuiDrawer-docked": {
            width: "200px !important",
          },
          /* opcional: forzar que el último item del nav no se corte y tenga margen arriba,
             si quieres "pegado al bottom" absoluto habría que hacer reglas más específicas
             según la estructura DOM generada por @toolpad, pero esto ayuda visualmente. */
          ".tp-navigationList > li:last-child": {
            marginTop: "auto",
          },
          ".css-9z93tp img": {
            maxHeight: "140px !important", // 👈 agrega esto
          },
        }}
      />
      <DashboardLayout>
        <UserNameOverlay userName={userName} />
        <DemoPageContentProfesores />
      </DashboardLayout>
    </AppProvider>
  );
}

export function DashboardEstudiante() {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const email = localStorage.getItem("email");
    if (email) {
      obtenerPerfilUsuario(email).then((perfil) => {
        if (perfil?.body?.nombre) {
          setUserName(`${perfil.body.nombre} ${perfil.body.apellido}`);
        } else {
          setUserName(email.split("@")[0]);
        }
      });
    }
  }, []);
  return (
    <AppProvider
      navigation={StudentNavigation}
      branding={{
        logo: (
          <img
            src="/LOGO_LICEO.png"
            alt="logo"
            style={{ height: "130px", width: "80px" }}
          />
        ),
        title: "GRAN MARISCAL ANTONIO JOSE DE SUCRE",
        homeUrl: "/estudiante/dashboard/",
      }}
      theme={demoTheme}
    >
      <SyncDarkMode />
      <GlobalStyles
        styles={{
          ".css-1y8nxit-MuiDrawer-docked .MuiDrawer-paper": {
            width: "230px !important", // cambia esto al ancho que desees
          },
          ".css-1y8nxit-MuiDrawer-docked": {
            width: "230px !important",
          },
          /* opcional: forzar que el último item del nav no se corte y tenga margen arriba,
             si quieres "pegado al bottom" absoluto habría que hacer reglas más específicas
             según la estructura DOM generada por @toolpad, pero esto ayuda visualmente. */
          ".tp-navigationList > li:last-child": {
            marginTop: "auto",
          },
          ".css-9z93tp img": {
            maxHeight: "140px !important", // 👈 agrega esto
          },
        }}
      />
      <DashboardLayout>
        <UserNameOverlay userName={userName} />
        <DemoPageContentStudent />
      </DashboardLayout>
    </AppProvider>
  );
}
