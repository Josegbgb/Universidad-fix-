import { useEffect, useState, type ReactNode } from "react";
import { obtenerMisAsignaciones } from "../api/ProfesoresPonerNotas";
import { Link, Route, Routes } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Typography from "@mui/material/Typography";
import ProfesorAsignatura from "./ProfesoresAsignatura";

type Asignacion = {
  id_rel_grado_asignatura: number;
  asignatura: string;
  anio: number;
  seccion: string;
};
export function ProfesorDashboard() {
  const [data, setData] = useState<Asignacion[]>([]);
  const [selectedCard, setSelectedCard] = useState(0);

  const cargar = async (email: string) => {
    // Recibir email como parámetro
    console.log("Email a enviar:", email);
    const res = await obtenerMisAsignaciones(email);
    console.log("Respuesta recibida:", res);
    setData(res);
  };

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    console.log("localStorage email:", storedEmail);
    if (storedEmail) {
      cargar(storedEmail); // Pasar directamente, sin usar estado
    } else {
      console.log("No hay email en localStorage");
    }
  }, []);
  const dataOrdenada = [...data].sort((a, b) => {
    // 1. Ordenar por año
    if (a.anio !== b.anio) {
      return a.anio - b.anio;
    }

    // 2. Ordenar por sección (A, B, C...)
    return a.seccion.localeCompare(b.seccion);
  });

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          mb: 4,
          pb: 2,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          Mis asignaciones
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Selecciona un grado y asignatura para cargar notas
        </Typography>
      </Box>

      {/* ❌ VACÍO */}
      {data.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 12,
            px: 2,
            bgcolor: "rgba(0,0,0,0.02)",
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tienes asignaciones actualmente
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Aún no se te han asignado grados o asignaturas
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 2.5,
          }}
        >
          {dataOrdenada.map((item, index) => (
            <Link
              key={item.id_rel_grado_asignatura}
              to={`anio/estudiantes/${item.id_rel_grado_asignatura}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2.5,
                  border: "1px solid",
                  borderColor:
                    selectedCard === index ? "primary.main" : "divider",
                  transition: "all 0.25s ease",

                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4,
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => setSelectedCard(index)}
                  data-active={selectedCard === index ? "" : undefined}
                  sx={{
                    height: "100%",
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1.2,
                      py: 3,
                      textAlign: "center",
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      sx={{ lineHeight: 1.2 }}
                    >
                      {item.asignatura}
                    </Typography>

                    <Box
                      sx={{
                        mt: 1,
                        width: "100%",
                        bgcolor: "primary.main",
                        color: "black",
                        borderRadius: 2,
                        py: 0.8,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontWeight: "900",
                        lineHeight: 1.8,
                        fontSize: "15px",
                        boxShadow: 2,
                      }}
                    >
                      {item.anio}° - Sección {item.seccion.toUpperCase()}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Box>
      )}
    </>
  );
}
export function ListasManejadorProfesores({ mode }: { mode: ReactNode }) {
  return (
    <Routes>
      <Route path="/" element={mode}></Route>
      <Route path="anio/estudiantes/:id" element={<ProfesorAsignatura />} />
    </Routes>
  );
}
