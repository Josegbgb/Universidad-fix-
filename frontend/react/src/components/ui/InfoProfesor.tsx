import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

import OutlinedInput from "@mui/material/OutlinedInput";

import { Edit, Save, Close } from "@mui/icons-material";

interface InfoProfesorProps {
  nombre: string;
  apellido: string;
  cedula: number | string;
  correo: string;
  telefono: string;
  direccion?: string;
  asignaturas?: { id: number; nombre: string }[];
  onSave?: (data: any) => Promise<void>;
  asignaturasDisponibles: { id: number; nombre: string }[]; // ← NUEVO
  hideAsignaturas?: boolean;
}

export function InfoProfesor({
  nombre,
  apellido,
  cedula,
  correo,
  telefono,
  direccion,
  asignaturas = [],
  onSave,
  asignaturasDisponibles = [],
  hideAsignaturas,
}: InfoProfesorProps) {
  const [editando, setEditando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showError, setShowError] = useState(false);
  const [form, setForm] = useState({
    nombre,
    apellido,
    cedula,
    correo,
    telefono,
    direccion,
    asignaturasIds: asignaturas.map((a) => a.id),
  });

  useEffect(() => {
    setForm({
      nombre,
      apellido,
      cedula,
      correo,
      telefono: String(telefono ?? "").replace(/\D/g, ""),
      direccion,
      asignaturasIds: asignaturas.map((a) => a.id),
    });
  }, [nombre, apellido, cedula, correo, telefono, direccion, asignaturas]);

  function handleChange(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    const errors: Record<string, string> = {};
    const telefonoLimpio = String(form.telefono ?? "").replace(/\D/g, "");

    const cedula = Number(form.cedula);
    if (
      form.cedula !== "" &&
      (isNaN(cedula) || cedula < 1000000 || cedula > 30000000)
    ) {
      errors.cedula = "El rango permitido es de 1,000,000 y 30,000,000";
    }

    const telStr = String(form.telefono ?? "");
    if (form.telefono !== "" && !/^[0-9]{11}$/.test(telStr)) {
      errors.telefono =
        "El teléfono debe tener exactamente 11 dígitos numéricos";
    }

    const correoStr = String(form.correo ?? "");
    if (form.correo !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoStr)) {
      errors.correo = "Correo electrónico inválido";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    try {
      const update = await onSave?.({
        ...form,
        telefono: telefonoLimpio, // 👈 guarda sin guión
      });
      setEditando(false);
      console.log("UPDATE:", update);
    } catch (err: any) {
      console.log("ERROR FRONT:", err);

      setErrorMsg(err?.message || "Error al actualizar");
      setShowError(true);
    }
  }

  function handleCancel() {
    setForm({
      nombre,
      apellido,
      cedula,
      correo,
      telefono,
      direccion,
      asignaturasIds: asignaturas.map((a) => a.id),
    });
    setEditando(false);
    setShowError(false);
    setErrorMsg("");
    setFieldErrors({});
  }

  return (
    <Paper
      elevation={3}
      sx={{
        width: "90%",
        maxWidth: 1200,
        margin: "20px auto",
        padding: 3,
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        backgroundColor: "inherit",
        color: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <h3 style={{ margin: 0 }}>Información del profesor</h3>

        <div>
          {!editando ? (
            <IconButton size="small" onClick={() => setEditando(true)}>
              <Edit fontSize="small" />
            </IconButton>
          ) : (
            <>
              <IconButton size="small" color="success" onClick={handleSave}>
                <Save fontSize="small" />
              </IconButton>

              <IconButton size="small" color="error" onClick={handleCancel}>
                <Close fontSize="small" />
              </IconButton>
            </>
          )}
        </div>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "20px",
        }}
      >
        <CampoEditable
          label="Nombre"
          value={form.nombre}
          editando={editando}
          onChange={(v) => handleChange("nombre", v)}
          error={fieldErrors.nombre}
        />

        <CampoEditable
          label="Apellido"
          value={form.apellido}
          editando={editando}
          onChange={(v) => handleChange("apellido", v)}
          error={fieldErrors.apellido}
        />

        <CampoEditable
          label="Cédula"
          value={form.cedula}
          editando={editando}
          onChange={(v) => handleChange("cedula", v)}
          error={fieldErrors.cedula}
        />

        <CampoEditable
          label="Correo"
          value={form.correo}
          editando={editando}
          onChange={(v) => handleChange("correo", v)}
          error={fieldErrors.correo}
          minWidth={200}
        />

        <CampoEditable
          label="Teléfono"
          value={form.telefono}
          editando={editando}
          onChange={(v) => handleChange("telefono", v)}
          error={fieldErrors.telefono}
          minWidth={160}
        />

        {direccion && (
          <CampoEditable
            label="Dirección"
            value={form.direccion}
            editando={editando}
            onChange={(v) => handleChange("direccion", v)}
            error={fieldErrors.direccion}
          />
        )}

        {/* ✅ ASIGNATURAS EDITABLES */}
        {!hideAsignaturas && (
          <div style={{ minWidth: 260, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                opacity: 0.7,
                marginBottom: 6,
              }}
            >
              Asignaturas que puede impartir
            </div>

            {!editando ? (
              // 🔒 MODO LECTURA
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  maxHeight: 120,
                  overflowY: "auto",
                  paddingRight: 4,
                }}
              >
                {asignaturas.length === 0 ? (
                  <span style={{ opacity: 0.6 }}>
                    Sin asignaturas registradas
                  </span>
                ) : (
                  asignaturas.map((a) => (
                    <Chip
                      key={a.id}
                      label={a.nombre}
                      size="small"
                      sx={{
                        backgroundColor: "#1f2937",
                        color: "#e5e7eb",
                      }}
                    />
                  ))
                )}
              </div>
            ) : (
              // ✏️ MODO EDICIÓN
              <FormControl fullWidth size="small">
                <Select
                  multiple
                  value={form.asignaturasIds ?? []}
                  onChange={(e) =>
                    handleChange("asignaturasIds", e.target.value as number[])
                  }
                  input={<OutlinedInput />}
                  renderValue={(selected) => (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {(selected as number[]).map((id) => {
                        const mat = asignaturasDisponibles.find(
                          (a) => a.id === id,
                        );
                        return (
                          <Chip
                            key={id}
                            label={mat?.nombre ?? id}
                            size="small"
                          />
                        );
                      })}
                    </div>
                  )}
                >
                  {(asignaturasDisponibles ?? []).map((a) => (
                    <MenuItem key={a.id} value={a.id}>
                      {a.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </div>
        )}
      </div>

      {showError && (
        <>
          <br />
          <div style={{ marginTop: 10, color: "red" }}>
            {errorMsg || "Ocurrió un error"}
          </div>
        </>
      )}
    </Paper>
  );
}

function CampoEditable({
  label,
  value,
  editando,
  onChange,
  error,
  minWidth = 160,
}: {
  label: string;
  value: any;
  editando: boolean;
  onChange?: (value: any) => void;
  error?: string;
  minWidth?: number; // 👈
}) {
  return (
    <div style={{ minWidth }}>
      <div
        style={{
          fontSize: 13,
          opacity: 0.7,
          marginBottom: 6, // 👈 antes 4
        }}
      >
        {label}
      </div>

      {!editando ? (
        <div style={{ fontSize: 15, fontWeight: 500 }}>{value}</div>
      ) : (
        <TextField
          size="small"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          fullWidth
          error={!!error}
          helperText={error}
        />
      )}
    </div>
  );
}
