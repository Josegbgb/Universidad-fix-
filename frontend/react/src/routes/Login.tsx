import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "@/api/Auth";
import * as React from "react";

// MUI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { createTheme } from "@mui/material/styles";
import GlobalStyles from "@mui/material/GlobalStyles";

// TOOLPAD
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";

// THEME
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

const validateEmail = (email: string): string => {
  if (!email) return "El correo es obligatorio";

  // Expresión regular para validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email))
    return "Ingresa un correo válido (ejemplo@dominio.com)";

  // Validar que tenga dominio y extensión válidos (al menos 2 caracteres después del punto)
  const domainParts = email.split("@")[1]?.split(".");
  if (!domainParts || domainParts.length < 2)
    return "El dominio debe tener extensión válida (ej: .com, .es)";

  const extension = domainParts[domainParts.length - 1];
  // Cambio: valida la extension del dominio para evitar una variable sin uso.
  if (!extension || extension.length < 2)
    return "El dominio debe tener extension valida (ej: .com, .es)";

  return "";
};

const validatePassword = (password: string): string => {
  if (!password) return "La contraseña es obligatoria";
  if (password.length < 6)
    return "La contraseña debe tener al menos 6 caracteres";
  return "";
};

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorResponse, setErrorResponse] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [triedSubmit, setTriedSubmit] = useState(false);

  const goTo = useNavigate();

  useEffect(() => {
    // Solo validar formato si el campo tiene contenido
    if (email) {
      const emailFormatErr = validateEmail(email);
      // Si el error es de formato (no vacío) lo mostramos siempre
      if (emailFormatErr && emailFormatErr !== "El correo es obligatorio") {
        setEmailError(emailFormatErr);
      } else if (!triedSubmit && !email) {
        // Si no ha intentado enviar y está vacío, no mostrar error
        setEmailError("");
      } else if (triedSubmit && !email) {
        // Si intentó enviar y está vacío, mostrar error
        setEmailError("El correo es obligatorio");
      } else {
        setEmailError("");
      }
    } else if (triedSubmit && !email) {
      setEmailError("El correo es obligatorio");
    } else {
      setEmailError("");
    }

    // Misma lógica para contraseña
    if (password) {
      const passwordFormatErr = validatePassword(password);
      if (
        passwordFormatErr &&
        passwordFormatErr !== "La contraseña es obligatoria"
      ) {
        setPasswordError(passwordFormatErr);
      } else if (!triedSubmit && !password) {
        setPasswordError("");
      } else if (triedSubmit && !password) {
        setPasswordError("La contraseña es obligatoria");
      } else {
        setPasswordError("");
      }
    } else if (triedSubmit && !password) {
      setPasswordError("La contraseña es obligatoria");
    } else {
      setPasswordError("");
    }
  }, [email, password, triedSubmit]);
  //
  //
  async function HandleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTriedSubmit(true);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    if (emailErr || passwordErr) {
      setEmailError(emailErr);
      setPasswordError(passwordErr);
      return;
    }
    try {
      const data = await login(email, password);
      const role = data.body.user.role;

      if (role === "admin") {
        goTo("/admin/dashboard");
      } else if (role === "profesor") {
        goTo("/profesor/dashboard");
      } else if (role === "estudiante") {
        goTo("/estudiante/dashboard");
      } else {
        goTo("/unauthorized");
      }

      setErrorResponse("");
    } catch (error: any) {
      const mensajeError = error.message || "Error de conexión";
      setErrorResponse(mensajeError);

      // 🔥 LIMPIAR CAMPOS
      setEmail("");
      setPassword("");

      // 🔥 Resetear estado de validación
      setTriedSubmit(false);
      setEmailError("");
      setPasswordError("");
    }
  }

  return (
    <AppProvider
      theme={demoTheme}
      branding={{
        title: "Gran Mariscal Antonio Jose de Sucre", // 🔥 TU NOMBRE AQUÍ
        logo: (
          <img
            src="/LOGO_LICEO.png"
            alt="logo"
            style={{ height: "130px", width: "80px" }}
          />
        ),
      }}
    >
      <GlobalStyles
        styles={{
          ".css-9z93tp img": {
            maxHeight: "140px !important", // 👈 agrega esto
          },
        }}
      />
      <DashboardLayout hideNavigation>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            bgcolor: "background.default",

            // 🔥 FONDO CON PROFUNDIDAD
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? "radial-gradient(circle at 50% 50%, rgba(25,118,210,0.2), transparent 60%)"
                : "radial-gradient(circle at 50% 50%, rgba(25,118,210,0.1), transparent 60%)",
          }}
        >
          {/* 👇 agrega esto */}

          <img
            src="/LOGO_LICEO.png"
            alt="logo"
            style={{
              position: "absolute",
              top: "0px",
              left: "50%",
              transform: "translateX(-50%)",
              height: "400px",
              width: "200px",
            }}
          />

          <Box
            component="form"
            onSubmit={HandleSubmit}
            noValidate
            sx={{
              width: "100%",
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              gap: 3,
              p: 4,
              borderRadius: 4,

              bgcolor: "background.paper",

              // 🔥 SOMBRA REAL (VISIBLE EN AMBOS MODOS)
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 8px 40px rgba(0,0,0,0.8)"
                  : "0 8px 30px rgba(0,0,0,0.2)",

              // 🔥 BORDE VISIBLE (clave en modo claro)
              border: "1px solid",
              borderColor: "divider",

              // 🔥 EFECTO DE RESALTE
              backdropFilter: "blur(8px)",

              // 🔥 HOVER SUAVE (se siente más pro)
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-3px)",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "0 12px 50px rgba(0,0,0,0.9)"
                    : "0 12px 40px rgba(0,0,0,0.25)",
              },
            }}
          >
            <Typography variant="h5" textAlign="center" fontWeight="bold">
              Iniciar Sesión
            </Typography>

            {errorResponse && (
              <Typography color="error" textAlign="center">
                {errorResponse}
              </Typography>
            )}

            <TextField
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTriedSubmit(false); // Resetear al escribir
                if (errorResponse) setErrorResponse("");
              }}
              fullWidth
              required={false} // 🔥 Cambiar a false para que no use la validación nativa
              error={!!emailError}
              helperText={emailError}
              sx={{
                "& .MuiFormHelperText-root": {
                  color: "error.main",
                },
              }}
            />

            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setTriedSubmit(false); // Resetear al escribir
                if (errorResponse) setErrorResponse("");
              }}
              fullWidth
              required={false} // 🔥 Cambiar a false para que no use la validación nativa
              error={!!passwordError}
              helperText={passwordError}
              sx={{
                "& .MuiFormHelperText-root": {
                  color: "error.main",
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.2,
                fontWeight: "bold",
                borderRadius: 2,
              }}
            >
              iniciar sesión
            </Button>

            <Typography
              variant="body2"
              sx={{
                cursor: "pointer",
                textAlign: "right",
                opacity: 0.7,
                "&:hover": { opacity: 1 },
              }}
              onClick={() => goTo("/change-password")}
            >
              Cambiar contraseña
            </Typography>
          </Box>
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}
