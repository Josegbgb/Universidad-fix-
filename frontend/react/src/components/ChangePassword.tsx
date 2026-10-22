import { useEffect, useState } from "react";
import { changePassword } from "@/api/changePassword";
import * as React from "react";

// MUI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { createTheme } from "@mui/material/styles";

// TOOLPAD
import { AppProvider } from "@toolpad/core/AppProvider";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { useNavigate } from "react-router-dom";

// THEME
const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: "data-toolpad-color-scheme",
  },
  colorSchemes: { light: true, dark: true },
});

export default function ChangePassword() {
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [triedSubmit, setTriedSubmit] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");

  const validateNewPassword = (password: string): string => {
    if (!password && triedSubmit) return "La nueva contraseña es obligatoria";
    if (password && password.length < 6)
      return "La contraseña debe tener al menos 6 caracteres";
    return "";
  };

  const validateConfirmPassword = (confirm: string, newPwd: string): string => {
    if (!confirm && triedSubmit) return "Debes confirmar la contraseña";
    if (confirm && newPwd && confirm !== newPwd)
      return "Las contraseñas no coinciden";
    return "";
  };
  const validateEmail = (email: string): string => {
    if (!email && triedSubmit) return "El correo es obligatorio";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "Correo inválido";
    return "";
  };

  const validateCurrentPassword = (pwd: string): string => {
    if (!pwd && triedSubmit) return "La contraseña actual es obligatoria";
    return "";
  };

  useEffect(() => {
    setEmailError(validateEmail(email));
    setCurrentPasswordError(validateCurrentPassword(currentPassword));
    setNewPasswordError(validateNewPassword(newPassword));
    setConfirmPasswordError(
      validateConfirmPassword(confirmPassword, newPassword),
    );
  }, [email, currentPassword, newPassword, confirmPassword, triedSubmit]);

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTriedSubmit(true);

    if (
      !email ||
      !currentPassword ||
      newPassword.length < 6 ||
      newPassword !== confirmPassword
    ) {
      return;
    }

    try {
      setLoading(true);
      const res = await changePassword(email, currentPassword, newPassword);
      const successMessage =
        res.body?.message || "Contraseña actualizada correctamente";
      localStorage.clear();
      setMessage(successMessage);

      // 🔥 REDIRECCIÓN AUTOMÁTICA
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: any) {
      setMessage(error.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppProvider
      theme={demoTheme}
      branding={{
        title: "Gran Mariscal Antonio Jose de Sucre",
      }}
    >
      <DashboardLayout hideNavigation>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "background.default",

            // 🔥 mismo fondo pro
            backgroundImage: (theme) =>
              theme.palette.mode === "dark"
                ? "radial-gradient(circle at 50% 50%, rgba(25,118,210,0.2), transparent 60%)"
                : "radial-gradient(circle at 50% 50%, rgba(25,118,210,0.1), transparent 60%)",
          }}
        >
          <Box
            component="form"
            onSubmit={handleChangePassword}
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

              // 🔥 sombra real visible SIEMPRE
              boxShadow: (theme) =>
                theme.palette.mode === "dark"
                  ? "0 8px 40px rgba(0,0,0,0.8)"
                  : "0 8px 30px rgba(0,0,0,0.2)",

              // 🔥 borde visible
              border: "1px solid",
              borderColor: "divider",

              backdropFilter: "blur(8px)",

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
              Cambiar contraseña
            </Typography>

            {message && (
              <Typography
                color={
                  message.includes("correctamente") ? "success.main" : "error"
                }
                textAlign="center"
              >
                {message}
              </Typography>
            )}

            <TextField
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTriedSubmit(false);
                setMessage("");
              }}
              fullWidth
              required={false}
              error={!!emailError}
              helperText={emailError}
            />

            <TextField
              label="Contraseña actual"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setTriedSubmit(false);
                setMessage("");
              }}
              fullWidth
              required={false}
              error={!!currentPasswordError}
              helperText={currentPasswordError}
            />

            <TextField
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setTriedSubmit(false);
                setMessage("");
              }}
              fullWidth
              required={false}
              error={!!newPasswordError}
              helperText={newPasswordError}
            />

            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setTriedSubmit(false);
                setMessage("");
              }}
              fullWidth
              required={false}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                py: 1.2,
                fontWeight: "bold",
                borderRadius: 2,
              }}
            >
              {loading ? "Cambiando..." : "Cambiar contraseña"}
            </Button>
          </Box>
        </Box>
      </DashboardLayout>
    </AppProvider>
  );
}
