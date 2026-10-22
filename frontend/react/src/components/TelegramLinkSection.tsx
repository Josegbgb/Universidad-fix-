import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TelegramIcon from "@mui/icons-material/Telegram";
import {
  generarCodigoTelegram,
  obtenerEstadoTelegram,
  type TelegramCodigo,
} from "@/api/telegram";

export default function TelegramLinkSection() {
  const [codigo, setCodigo] = useState<TelegramCodigo | null>(null);
  const [vinculado, setVinculado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    obtenerEstadoTelegram()
      .then((estado) => setVinculado(estado.vinculado))
      .catch(() => setVinculado(false));
  }, []);

  async function generarCodigo() {
    setLoading(true);
    setMensaje("");
    try {
      // Cambio: genera un codigo de un solo uso desde la cuenta autenticada.
      const data = await generarCodigoTelegram();
      setCodigo(data);
      setMensaje("Codigo generado correctamente");
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "ERROR_TELEGRAM");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Divider sx={{ mb: 3 }} />
      <Stack spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Telegram
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estado: {vinculado ? "Cuenta vinculada" : "Sin vincular"}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<TelegramIcon />}
          onClick={generarCodigo}
          disabled={loading}
          sx={{ alignSelf: "flex-start", fontWeight: "bold" }}
        >
          {loading ? "Generando..." : "Vincular cuenta de Telegram"}
        </Button>

        {codigo && (
          <Box
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Envia este comando a {codigo.bot_username ?? "tu bot"}:
            </Typography>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ mt: 1 }}
            >
              /vincular {codigo.codigo}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Expira: {new Date(codigo.expira_at).toLocaleString()}
            </Typography>
          </Box>
        )}

        {mensaje && (
          <Typography
            variant="body2"
            color={mensaje.includes("correctamente") ? "success.main" : "error"}
          >
            {mensaje}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
