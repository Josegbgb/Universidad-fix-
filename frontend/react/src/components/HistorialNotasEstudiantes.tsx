import { useEffect, useState } from "react";
import { obtenerMiHistorial } from "../api/estudianteNotas";
import { SortableTable } from "./ui/Table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../public/LOGO_LICEO.png";

import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Divider,
} from "@mui/material";
import { Save } from "@mui/icons-material";

type NotaRaw = { asignatura: string; lapso: number; nota: number | "IN" };
type GradoHistorial = { anio: number; seccion: string; notas: NotaRaw[] };

type Fila = {
  asignatura: string;
  lapso1: string;
  lapso2: string;
  lapso3: string;
  definitiva: string;
};

const columnas = [
  { label: "Asignatura", key: "asignatura", sortable: true },
  { label: "Lapso 1", key: "lapso1" },
  { label: "Lapso 2", key: "lapso2" },
  { label: "Lapso 3", key: "lapso3" },
  { label: "Definitiva", key: "definitiva", sortable: true },
] as const;
type HistorialData = {
  nombre: string;
  apellido: string;
  historial: GradoHistorial[];
};

// IN (inasistente) se muestra como "IN", pero cuenta como 0 en el promedio
const num = (n: number | "IN") => (n === "IN" ? 0 : Number(n));

function construirFilas(notas: NotaRaw[]): Fila[] {
  const agrupado: Record<string, NotaRaw[]> = {};
  notas.forEach((n) => {
    if (!agrupado[n.asignatura]) agrupado[n.asignatura] = [];
    agrupado[n.asignatura].push(n);
  });

  return Object.entries(agrupado).map(([asignatura, ns]) => {
    const l1 = ns.find((n) => n.lapso === 1)?.nota ?? 0;
    const l2 = ns.find((n) => n.lapso === 2)?.nota ?? 0;
    const l3 = ns.find((n) => n.lapso === 3)?.nota ?? 0;
    const definitiva = ((num(l1) + num(l2) + num(l3)) / 3).toFixed(2);

    return {
      asignatura,
      lapso1: String(l1),
      lapso2: String(l2),
      lapso3: String(l3),
      definitiva,
    };
  });
}

export default function HistorialCompleto() {
  const [historial, setHistorial] = useState<GradoHistorial[]>([]);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [data, setData] = useState<HistorialData | null>(null);
  useEffect(() => {
    obtenerMiHistorial().then((res) => {
      setData(res);
      setHistorial(res?.historial ?? []);
    });

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

  const nombreEstudiante = data ? `${data.nombre} ${data.apellido}` : "";
  if (historial.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
        No tienes historial académico aún
      </div>
    );
  }
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    historial.forEach((grado, index) => {
      // Nueva página para cada grado excepto el primero
      if (index > 0) doc.addPage();

      // HEADER
      doc.setFillColor(15, 40, 80);
      doc.rect(0, 0, pageWidth, 38, "F");

      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 8, -10, 30, 60);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(
        `LICEO "GRAN MARISCAL ANTONIO JOSE DE SUCRE"`,
        pageWidth / 2,
        12,
        { align: "center" },
      );

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
      doc.text("HISTORIAL ACADÉMICO", pageWidth / 2, 30, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Fecha: ${new Date().toLocaleDateString("es-VE")}`,
        pageWidth - 14,
        35,
        { align: "right" },
      );

      // LÍNEA DORADA
      doc.setDrawColor(200, 160, 0);
      doc.setLineWidth(0.8);
      doc.line(14, 40, pageWidth - 14, 40);

      // SUBTÍTULO DEL GRADO
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${nombreEstudiante}`, 14, 48); // 👈 nombre a la izquierda

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${grado.anio}° Año — Sección ${grado.seccion.toUpperCase()}`,
        pageWidth / 2,
        48,
        { align: "center" },
      );

      // CONSTRUIR FILAS
      const agrupado: Record<string, any[]> = {};
      grado.notas.forEach((n) => {
        if (!agrupado[n.asignatura]) agrupado[n.asignatura] = [];
        agrupado[n.asignatura].push(n);
      });

      const body = Object.entries(agrupado).map(([asignatura, ns]) => {
        const l1 = ns.find((n) => n.lapso === 1)?.nota ?? 0;
        const l2 = ns.find((n) => n.lapso === 2)?.nota ?? 0;
        const l3 = ns.find((n) => n.lapso === 3)?.nota ?? 0;
        const definitiva = ((num(l1) + num(l2) + num(l3)) / 3).toFixed(2);

        return [asignatura, l1, l2, l3, definitiva];
      });
      const tableWidth = 70 + 22 + 22 + 22 + 28; // suma de tus columnas
      const marginLeft = (pageWidth - tableWidth) / 2;

      // TABLA
      autoTable(doc, {
        startY: 58,
        head: [["Asignatura", "Lapso 1", "Lapso 2", "Lapso 3", "Definitiva"]],
        body,
        theme: "grid",
        margin: { left: marginLeft, right: marginLeft }, // 👈 ESTA ES LA CLAVE
        styles: { fontSize: 9, cellPadding: 3, textColor: [30, 30, 30] },
        headStyles: {
          fillColor: [15, 40, 80],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 22, halign: "center" },
          2: { cellWidth: 22, halign: "center" },
          3: { cellWidth: 22, halign: "center" },
          4: { cellWidth: 28, halign: "center" },
        },
        // 🔥 colorear definitiva según aprobado/reprobado
        didParseCell: (data) => {
          if (data.column.index === 4 && data.section === "body") {
            const val = parseFloat(String(data.cell.raw));
            if (!isNaN(val)) {
              data.cell.styles.textColor =
                val >= 10 ? [0, 128, 0] : [200, 0, 0];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
        didDrawPage: () => {
          const pageNum = doc.getNumberOfPages();
          doc.setDrawColor(200, 160, 0);
          doc.setLineWidth(0.5);
          doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
          doc.setTextColor(100, 100, 100);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.text(
            "Liceo Gran Mariscal Antonio Jose de Sucre — Documento generado automáticamente",
            pageWidth / 2,
            pageHeight - 12,
            { align: "center" },
          );
          doc.text(`Página ${pageNum}`, pageWidth - 14, pageHeight - 12, {
            align: "right",
          });
        },
      });
    });

    doc.save("historial_academico.pdf");
  };
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
          mb: 4,
          pb: 2,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h5" fontWeight="bold" sx={{ flexGrow: 1 }}>
          Historial Académico
          <br />
          <strong style={{ fontSize: "14px" }}>{nombreEstudiante}</strong>
        </Typography>
        <Typography variant="body2" color="primary">
          Exportar historial academico
        </Typography>
        <Tooltip title="Exportar PDF">
          <IconButton
            color="primary"
            onClick={exportarPDF}
            sx={{
              bgcolor: "action.hover",
              "&:hover": { bgcolor: "action.selected" },
            }}
          >
            <Save />
          </IconButton>
        </Tooltip>
      </Box>
      {/* HEADER */}

      {/* LISTA DE GRADOS */}
      {historial.map((grado, i) => (
        <Paper
          key={i}
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* TÍTULO DEL GRADO */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight="bold">
              {grado.anio}° año — Sección {grado.seccion.toUpperCase()}
            </Typography>
            <Divider sx={{ mt: 1 }} />
          </Box>

          {/* TABLA */}
          <SortableTable
            columns={columnas}
            rows={construirFilas(grado.notas)}
          />
        </Paper>
      ))}
    </Box>
  );
}
