import { Routes, Route } from "react-router-dom";
import { Login } from "../src/routes/Login";
import ProtectedRoute from "../src/routes/ProtectedRoute";
import DashboardAdmin, {
  DashboardEstudiante,
  DashboardProfesor,
} from "../src/components/dashboard";
import ChangePassword from "./components/ChangePassword";
//import DashboardProfesor from "@/pages/Profesor/DashboardProfesor"; --UPDATE THIS LATER
//import DashboardEstudiante from "@/pages/Estudiante/DashboardEstudiante";--UPDATE THIS LATER
//import Unauthorized from "@/pages/Unauthorized";

function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/" element={<Login />} />

      {/* Ruta si intenta acceder sin permiso */}
      <Route path="/unauthorized" element={<Login />} />

      {/* Rutas protegidas */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard/*" element={<DashboardAdmin />} />
      </Route>

      <Route path="/change-password" element={<ChangePassword />} />

      <Route element={<ProtectedRoute allowedRoles={["profesor"]} />}>
        <Route path="/profesor/dashboard/*" element={<DashboardProfesor />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["estudiante"]} />}>
        <Route
          path="/estudiante/dashboard/*"
          element={<DashboardEstudiante />}
        />
      </Route>
    </Routes>
  );
}

export default App;
