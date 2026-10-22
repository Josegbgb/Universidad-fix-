import { useState } from "react";

import ButtonMUI from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { promoverTodos } from "../api/promocion";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "min(520px, 90%)",
  bgcolor: "background.paper",
  borderRadius: "12px",
  boxShadow: 24,
  p: 4,
};

export default function PromoverEstudiantesBtn() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const handlePromover = async () => {
    try {
      setLoading(true);
      const res = await promoverTodos();
      setResultado(res.body); // depende de tu jsonResponse
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertir = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "http://localhost:1234/promociones/promocion/revertir-todos",
        { method: "POST", headers: { "Content-Type": "application/json" } },
      );
      const data = await res.json();
      setResultado({ ...data.body, tipo: "revertir" }); // 👈 marca el tipo
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* BOTÓN */}
      <ButtonMUI variant="outlined" size="small" onClick={() => setOpen(true)}>
        Promover estudiantes
      </ButtonMUI>

      {/* MODAL */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          {/* HEADER */}
          <Typography variant="h6" fontWeight="bold" mb={1}>
            Promoción anual de estudiantes
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, lineHeight: 1.6 }}
          >
            Esta acción evaluará todos los estudiantes registrados en el
            sistema.
            <br />
            Los estudiantes que cumplan con los requisitos serán promovidos al
            siguiente año académico, mientras que los demás repetirán.
            <br />
            Los estudiantes de último año serán egresados automáticamente.
            <br />
            <br />
            Verifique que todas las calificaciones estén correctamente cargadas
            antes de continuar.
          </Typography>

          {/* BOTONES */}
          {!resultado && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1.5,
                flexWrap: "wrap",
              }}
            >
              <ButtonMUI
                variant="outlined"
                color="error"
                onClick={handleRevertir}
                disabled={loading}
              >
                {loading ? "Procesando..." : "Revertir"}
              </ButtonMUI>

              <ButtonMUI
                variant="contained"
                onClick={handlePromover}
                disabled={loading}
              >
                {loading ? "Procesando..." : "Confirmar"}
              </ButtonMUI>
            </Box>
          )}

          {/* RESULTADO */}
          {resultado && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "inherit",
              }}
            >
              {resultado.tipo === "revertir" ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Registros revertidos:{" "}
                    <strong>{resultado.revertidos?.length ?? 0}</strong>
                  </Typography>

                  {resultado.errores?.length > 0 && (
                    <Typography variant="body2" color="error">
                      Errores detectados: {resultado.errores.length}
                    </Typography>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Promovidos:{" "}
                    <strong>{resultado.promovidos?.length ?? 0}</strong>
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Repitentes:{" "}
                    <strong>{resultado.repitentes?.length ?? 0}</strong>
                  </Typography>

                  <Typography variant="body2">
                    Egresados:{" "}
                    <strong>{resultado.egresados?.length ?? 0}</strong>
                  </Typography>
                </>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                <ButtonMUI
                  variant="contained"
                  onClick={() => {
                    setOpen(false);
                    setResultado(null);
                  }}
                >
                  Cerrar
                </ButtonMUI>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
}
