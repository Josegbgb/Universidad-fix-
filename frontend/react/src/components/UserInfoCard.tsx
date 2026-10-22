import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// MUI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import Divider from "@mui/material/Divider";
import { getMyProfile, updateMyProfile } from "@/api/users";
import TelegramLinkSection from "./TelegramLinkSection";

export default function ProfileCard() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"admin" | "profesor" | "estudiante" | "">(
    "",
  );

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    correo: "",
    telefono: "",
    direccion: "",
  });

  const [loading, setLoading] = useState(false);
  const [initialForm, setInitialForm] = useState({ ...form });
  const [message, setMessage] = useState("");

  // 🔥 cargar datos
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyProfile();

        if (!data) {
          setMessage("No se pudo cargar el perfil");
          return;
        }
        setForm({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          cedula: data.cedula ? String(data.cedula) : "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
        });

        setRole(data.role);
        setInitialForm({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          cedula: data.cedula ? String(data.cedula) : "",
          correo: data.correo || "",
          telefono: data.telefono || "",
          direccion: data.direccion || "",
        });
      } catch (err: any) {
        setMessage(err.message);
      }
    };

    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    }
  };
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const validate = () => {
    const errors: Record<string, string> = {};

    if (form.cedula !== "") {
      const cedula = Number(form.cedula);
      if (isNaN(cedula) || !/^[0-9]+$/.test(form.cedula)) {
        errors.cedula = "Solo se permiten números";
      } else if (
        role === "estudiante" &&
        (cedula < 1000000 || cedula > 50000000)
      ) {
        errors.cedula = "La cédula debe estar entre 1,000,000 y 50,000,000";
      } else if (
        (role === "admin" || role === "profesor") &&
        (cedula < 1000000 || cedula > 30000000)
      ) {
        errors.cedula = "La cédula debe estar entre 1,000,000 y 30,000,000";
      }
    }

    if (form.telefono !== "") {
      const telLimpio = form.telefono.replace(/\D/g, "");
      if (!/^[0-9]{11}$/.test(telLimpio)) {
        errors.telefono = "El teléfono debe tener exactamente 11 dígitos";
      }
    }

    if (form.correo !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
        errors.correo = "Correo electrónico inválido";
      }
    }

    return errors;
  };
  const handleUpdate = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    try {
      setLoading(true);
      setMessage("");

      // 🔥 solo enviar campos con valor
      const dataToSend: any = {};

      Object.entries(form).forEach(([key, value]) => {
        if (value !== "") {
          dataToSend[key] = value;
        }
      });

      // 👇 agrega guión al teléfono antes de enviar
      if (dataToSend.telefono) {
        const tel = dataToSend.telefono.replace(/\D/g, "");
        dataToSend.telefono = `${tel.slice(0, 4)}-${tel.slice(4)}`;
      }

      const res = await updateMyProfile(dataToSend);
      setMessage("Actualizado correctamente");

      // 🔥 logout si cambia correo
      if (res.logout) {
        localStorage.clear();
        navigate("/");
      }
    } catch (err: any) {
      setMessage(err.message); // 🔥 muestra errores del backend (duplicados, etc)
    } finally {
      setLoading(false);
    }
  };
  const hasChanges = Object.keys(form).some(
    (key) =>
      form[key as keyof typeof form] !==
      initialForm[key as keyof typeof initialForm],
  );
  const isEstudiante = role === "estudiante";
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 700,
        mx: "auto",
        mt: 4,
        p: 4,
        borderRadius: 4,
        bgcolor: "background.paper",

        // 🔥 CARD QUE RESALTA
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 10px 40px rgba(0,0,0,0.8)"
            : "0 10px 30px rgba(0,0,0,0.15)",

        border: "1px solid",
        borderColor: "divider",

        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-4px)",
        },
      }}
    >
      {/* HEADER */}
      <Typography variant="h5" fontWeight="bold" mb={1}>
        Mi Perfil
      </Typography>
      <Typography variant="body2" fontWeight="bold" mb={1} color="primary">
        {role.toUpperCase()}
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Actualiza tu información personal
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* FORM */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ flex: "1 1 48%" }}>
          <TextField
            label="Nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            fullWidth
            disabled={isEstudiante}
          />
        </Box>

        <Box sx={{ flex: "1 1 48%" }}>
          <TextField
            label="Apellido"
            name="apellido"
            value={form.apellido}
            onChange={handleChange}
            fullWidth
            disabled={isEstudiante}
          />
        </Box>

        <Box sx={{ flex: "1 1 48%" }}>
          <TextField
            label="Cédula"
            name="cedula"
            value={form.cedula}
            onChange={handleChange}
            fullWidth
            error={!!fieldErrors.cedula}
            helperText={fieldErrors.cedula}
            disabled={isEstudiante}
          />
        </Box>

        <Box sx={{ flex: "1 1 48%" }}>
          <TextField
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            fullWidth
            error={!!fieldErrors.telefono}
            helperText={fieldErrors.telefono}
            disabled={isEstudiante}
          />
        </Box>

        <Box sx={{ flex: "1 1 100%" }}>
          <TextField
            label="Correo"
            name="correo"
            value={form.correo}
            onChange={handleChange}
            fullWidth
            error={!!fieldErrors.correo}
            helperText={fieldErrors.correo}
            disabled={isEstudiante}
          />
        </Box>

        {(role === "admin" || role === "profesor") && (
          <Box sx={{ flex: "1 1 100%" }}>
            <TextField
              label="Dirección"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              disabled={isEstudiante}
              fullWidth
            />
          </Box>
        )}
      </Box>

      {/* MENSAJE */}
      {message && (
        <Typography
          mt={2}
          textAlign="center"
          color={message.includes("correctamente") ? "success.main" : "error"}
        >
          {message}
        </Typography>
      )}

      {/* BOTONES */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mt: 4,
          flexWrap: "wrap",
        }}
      >
        {!isEstudiante && (
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={loading || !hasChanges}
            sx={{
              flex: 1,
              minWidth: 150,
              py: 1.2,
              fontWeight: "bold",
              borderRadius: 2,
            }}
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </Button>
        )}

        <Button
          variant="outlined"
          onClick={() => navigate("/change-password")}
          sx={{
            flex: 1,
            minWidth: 150,
            py: 1.2,
            fontWeight: "bold",
            borderRadius: 2,
          }}
        >
          Cambiar contraseña
        </Button>
        {isEstudiante && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 2, textAlign: "center" }}
          >
            Modo solo lectura
          </Typography>
        )}
      </Box>

      <TelegramLinkSection />
    </Box>
  );
}
