import TextField from "@mui/material/TextField";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Dato = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="subtitle2">{label}:</Typography>
    <Typography variant="body2">{value ?? "-"}</Typography>
  </Box>
);
interface EditLayoutProps {
  title: string;
  description: string;
  campos: string[];
  register: any;
  errors: any;
  getValidations?: (campo: string) => any;
  datosActuales: Record<string, any>;
}
export default function EditLayout({
  title,
  description,
  campos,
  register,
  errors,
  getValidations,
  datosActuales,
}: EditLayoutProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "2.2fr 1.3fr",
        },
        gap: 4,
        maxWidth: 900,
        mx: "auto",
        alignItems: "flex-start",
      }}
    >
      {/* FORM */}
      <Box>
        <Typography variant="h6" mb={1}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          {description}
        </Typography>

        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr 1fr",
            },
            gap: 2,
          }}
        >
          {campos.map((campo) => {
            const field = campo.toLowerCase();
            const error = errors?.[field];

            return (
              <TextField
                key={campo}
                size="small"
                fullWidth
                label={campo}
                error={!!error}
                helperText={error?.message}
                {...register(field, getValidations?.(campo))}
              />
            );
          })}
        </Box>
      </Box>

      {/* DATOS ACTUALES */}
      <Box>
        <Typography variant="h6" mb={1}>
          Datos actuales
        </Typography>

        <Typography variant="body2" color="text.secondary" mb={2}>
          Información registrada
        </Typography>

        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            boxShadow: {
              xs: "none",
              md: "0 6px 16px rgba(0,0,0,0.12)",
            },
            display: "grid",
            gap: 1.5,
          }}
        >
          {Object.entries(datosActuales).map(([key, value]) => (
            <Dato key={key} label={key} value={value} />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
