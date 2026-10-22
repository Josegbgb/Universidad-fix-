import { guardarNota } from "@/api/ProfesoresPonerNotas";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  TextField,
  Box,
} from "@mui/material";
import { useState, useEffect } from "react";
import { AlertDemo } from "./Alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IconButton, Tooltip } from "@mui/material";
import { Save } from "@mui/icons-material";
import logo from "../../public/LOGO_LICEO.png";

type NotaAdmin = {
  id_estudiante: number;
  nombre: string;
  apellido: string;
  id_rel_estudiante_grado: number;
  asignaturas: {
    id_rel_grado_asignatura: number;
    nombre: string;
    notas: Record<number, number | "IN" | null>;
  }[];
};

type Props = {
  data: NotaAdmin[];
  onReload: () => void;
};

export function TablaNotasAdmin({ data, onReload }: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [logoBase64, setLogoBase64] = useState<string>("");

  const [alert, setAlert] = useState<{
    type: "actualizar" | "error";
  } | null>(null);

  const asignaturas = data[0]?.asignaturas || [];

  const handleSave = async (
    est: NotaAdmin,
    id_rel_grado_asignatura: number,
    lapso: number,
  ) => {
    let nota: number | "IN" | null = null;

    const value = tempValue.trim();

    // ✅ vacío = null
    if (value === "") {
      nota = null;
    } else if (value.toUpperCase() === "IN") {
      // Cambio: IN (inasistente)
      nota = "IN";
    } else {
      nota = Number(value);

      // ❌ no es número
      if (isNaN(nota)) {
        setAlert({ type: "error" });
        return;
      }

      // ❌ rango inválido
      if (nota < 0 || nota > 20) {
        setAlert({ type: "error" });
        return;
      }

      // ❌ más de 2 decimales
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        setAlert({ type: "error" });
        return;
      }
    }

    try {
      await guardarNota({
        id_rel_estudiante_grado: est.id_rel_estudiante_grado,
        id_rel_grado_asignatura,
        id_lapso: lapso,
        nota,
      });

      setEditing(null);
      setAlert({ type: "actualizar" });
      onReload();
    } catch {
      setAlert({ type: "error" });
    }
  };
  // 🔥 calcular dinámicamente ancho de columnas

  const exportarPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a3",
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // ===== HEADER =====
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 0, pageWidth, 38, "F");

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 8, -10, 30, 60);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`LICEO "GRAN MARISCAL ANTONIO JOSE DE SUCRE"`, pageWidth / 2, 12, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("RIF Institucional: J406314854", pageWidth / 2, 18, {
      align: "center",
    });
    doc.text("Cabimas, Punta Gorda, Edo. Zulia", pageWidth / 2, 23, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SABANA DE NOTAS", pageWidth / 2, 30, { align: "center" });

    doc.setFontSize(8);
    doc.text(
      `Fecha: ${new Date().toLocaleDateString("es-VE")}`,
      pageWidth - 14,
      35,
      { align: "right" },
    );

    // línea dorada
    doc.setDrawColor(200, 160, 0);
    doc.setLineWidth(0.8);
    doc.line(14, 40, pageWidth - 14, 40);

    // ===== TABLA =====
    // 🔥 calcular dinámicamente ancho de columnas
    const totalColumnas = 2 + asignaturas.length * 4;

    // ancho disponible real del PDF
    const tableWidth = pageWidth - 20; // márgenes (14 + 14)

    // 🔥 nombre y apellido más pequeños
    const anchoNombre = 15;
    const anchoApellido = 15;
    const MIN_ANCHO_NOTA = 10; // 🔥 más compacto
    // 🔥 resto se reparte equitativamente
    let anchoNotas =
      (tableWidth - anchoNombre - anchoApellido) / (totalColumnas - 2);

    // 🔥 evitar columnas ilegibles
    if (anchoNotas < MIN_ANCHO_NOTA) {
      anchoNotas = MIN_ANCHO_NOTA;
    }

    // 🔥 construir estilos dinámicos
    const columnStyles: any = {
      0: { cellWidth: anchoNombre },
      1: { cellWidth: anchoApellido },
    };

    // todas las demás columnas iguales
    for (let i = 2; i < totalColumnas; i++) {
      columnStyles[i] = {
        cellWidth: anchoNotas,
        halign: "center",
      };
    }

    const head = [
      [
        { content: "Nombre", rowSpan: 2 },
        { content: "Apellido", rowSpan: 2 },
        ...asignaturas.map((a) => ({
          content:
            a.nombre.length > 12
              ? a.nombre.split(" ")[0] // 🔥 más limpio
              : a.nombre,
          colSpan: 4,
          styles: { halign: "center" },
        })),
      ],
      [...asignaturas.flatMap(() => ["L1", "L2", "L3", "Def"])],
    ];
    const body = data.map((est) => {
      const fila: any[] = [est.nombre, est.apellido];

      est.asignaturas.forEach((asig) => {
        const n1 = asig.notas[1] ?? "-";
        const n2 = asig.notas[2] ?? "-";
        const n3 = asig.notas[3] ?? "-";

        const validas = [n1, n2, n3]
          .filter((n) => n !== "-")
          .map((n) => (n === "IN" ? 0 : Number(n)));

        const def =
          validas.length > 0
            ? (validas.reduce((a, b) => a + b, 0) / validas.length).toFixed(2)
            : "-";

        fila.push(n1, n2, n3, def);
      });

      return fila;
    });
    autoTable(doc, {
      startY: 48,
      // @ts-expect-error: TypeScript type mismatch workaround for halign
      head,
      body,
      theme: "grid",

      tableWidth: pageWidth - 20,

      margin: { left: 10, right: 10 },

      styles: {
        fontSize:
          asignaturas.length <= 5
            ? 10
            : asignaturas.length <= 8
              ? 8
              : asignaturas.length <= 12
                ? 7
                : 6,
        cellPadding: 1,
        overflow: "linebreak", // 🔥 IMPORTANTE (antes hidden)
        valign: "middle",
      },

      headStyles: {
        fillColor: [15, 40, 80],
        textColor: [255, 255, 255],
        halign: "center" as import('jspdf-autotable').HAlignType,
        fontStyle: "bold",
        fontSize: 7,
      },

      columnStyles,

      didParseCell: (dataCell) => {
        if (dataCell.section === "body" && dataCell.column.index >= 2) {
          const val = parseFloat(String(dataCell.cell.raw));
          if (!isNaN(val)) {
            dataCell.cell.styles.textColor =
              val >= 10 ? [0, 128, 0] : [200, 0, 0];
          }
        }
      },
    });

    doc.save("sabana_notas.pdf");
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logo;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      setLogoBase64(canvas.toDataURL("image/png"));
    };
  }, []);
  if (!data.length) return <p>No hay asignaturas registradas</p>;

  const MIN_WIDTH_NOMBRE = 100;
  const MIN_WIDTH_APELLIDO = 100;
  const MIN_WIDTH_NOTA = 70; // 🔥 ESTE es el que ajustarás luego

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        <Tooltip title="Exportar PDF">
          <IconButton onClick={exportarPDF}>
            <Save />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table sx={{ minWidth: "max-content", tableLayout: "auto" }}>
          <TableHead>
            {/* HEADER PRINCIPAL */}
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  borderRight: "1px solid #ddd",
                  minWidth: MIN_WIDTH_NOMBRE,
                }}
              >
                Nombre
              </TableCell>
              <TableCell
                rowSpan={2}
                sx={{
                  borderRight: "1px solid #ddd",
                  minWidth: MIN_WIDTH_APELLIDO,
                }}
              >
                Apellido
              </TableCell>

              {asignaturas.map((asig) => (
                <TableCell
                  key={asig.id_rel_grado_asignatura}
                  align="center"
                  colSpan={4}
                  sx={{
                    fontWeight: "bold",
                    borderRight: "1px solid #ddd",
                    minWidth: MIN_WIDTH_NOTA * 4,
                  }}
                >
                  {asig.nombre}
                </TableCell>
              ))}
            </TableRow>

            {/* SUB HEADER */}
            <TableRow>
              {asignaturas.map((asig) =>
                ["Lapso #1", "Lapso #2", "Lapso #3", "Def"].map((l, i) => (
                  <TableCell
                    key={asig.id_rel_grado_asignatura + "-" + l}
                    align="center"
                    sx={{
                      borderRight: i === 3 ? "1px solid #ddd" : "none",
                      minWidth: MIN_WIDTH_NOTA,
                    }}
                  >
                    {l}
                  </TableCell>
                )),
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((est) => (
              <TableRow key={est.id_estudiante}>
                <TableCell
                  sx={{
                    borderRight: "1px solid #ddd",
                    minWidth: MIN_WIDTH_NOMBRE,
                  }}
                >
                  {est.nombre}
                </TableCell>
                <TableCell
                  sx={{
                    borderRight: "1px solid #ddd",
                    minWidth: MIN_WIDTH_APELLIDO,
                  }}
                >
                  {est.apellido}
                </TableCell>

                {est.asignaturas.map((asig) => {
                  const n1 = asig.notas[1];
                  const n2 = asig.notas[2];
                  const n3 = asig.notas[3];

                  const validas = [n1, n2, n3]
                    .filter((n) => n != null)
                    .map((n) => (n === "IN" ? 0 : Number(n)));

                  const definitiva =
                    validas.length > 0
                      ? (
                          validas.reduce((a, b) => a + b, 0) / validas.length
                        ).toFixed(2)
                      : "-";

                  return (
                    <>
                      {[1, 2, 3].map((lapso) => {
                        const key = `${est.id_estudiante}-${asig.id_rel_grado_asignatura}-${lapso}`;
                        const val = asig.notas[lapso];

                        return (
                          <TableCell
                            key={key}
                            sx={{ minWidth: MIN_WIDTH_NOTA }}
                          >
                            {editing === key ? (
                              <TextField
                                size="small"
                                value={tempValue}
                                autoFocus
                                onChange={(e) => setTempValue(e.target.value)}
                                onBlur={() => setEditing(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleSave(
                                      est,
                                      asig.id_rel_grado_asignatura,
                                      lapso,
                                    );
                                  }
                                }}
                                inputProps={{ min: 0, max: 20 }}
                                sx={{
                                  width: 70,
                                  "& input": {
                                    textAlign: "center",
                                    fontWeight: 600,
                                  },
                                }}
                              />
                            ) : (
                              <Box
                                onDoubleClick={() => {
                                  setEditing(key);
                                  setTempValue(String(val ?? ""));
                                }}
                                sx={{
                                  textAlign: "center",
                                  cursor: "pointer",
                                  fontWeight: 600,
                                  borderRadius: 1,
                                  px: 1,
                                  py: 0.5,
                                  "&:hover": {
                                    backgroundColor: "primary.main",
                                    color: "white",
                                  },
                                }}
                              >
                                {val ?? "-"}
                              </Box>
                            )}
                          </TableCell>
                        );
                      })}

                      <TableCell
                        align="center"
                        sx={{
                          borderRight: "1px solid #ddd",
                          minWidth: MIN_WIDTH_NOTA,
                        }}
                      >
                        {definitiva}
                      </TableCell>
                    </>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {alert && (
        <AlertDemo
          duration={2000}
          action={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
    </>
  );
}
