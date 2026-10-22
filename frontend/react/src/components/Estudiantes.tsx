import { useEffect, useState } from "react";
import { eliminarEstudiante, obtenerEstudiantes } from "../api/estudiantes.ts";
import type { Estudiantes } from "../interfaces/interface.ts";

import { Button } from "react-bootstrap";
import { Save } from "@mui/icons-material";

// Cambio: usa el casing real del archivo Table.tsx en Windows/TS.
import { SortableTable } from "./ui/Table";
import VisibilityIcon from "@mui/icons-material/Visibility";
import IconButtonMUI from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { useNavigate } from "react-router-dom";
import {
  AgregarEstudiantes,
  EditarEstudiante,
  EliminarEstudiante,
} from "./svg.tsx";

import BasicModal from "./ui/AgregarEstudianteComponent.tsx";
import { OptionsModal } from "./ui/BasicModal.tsx";
import { DisponiblesAgregar } from "./DisponiblesAgregar.tsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import TextField from "@mui/material/TextField";
import logo from "../../public/LOGO_LICEO.png";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

// ======================
// TIPOS
// ======================
type FilaEstudiante = {
  nombre: string;
  apellido: string;
  cedula: number;
  telefono: string;
  correo: string;
  lugar_nacimiento: string;
  entidad_federal: string;
  año: string | number;
  seccion: string;
  acciones: React.ReactNode;
};

// ======================
// COMPONENTE
// ======================
function EstudiantesComponent() {
  const [logoBase64, setLogoBase64] = useState<string>("");
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState<Estudiantes[]>([]);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<
    number | null
  >(null);
  const [estudianteSeleccionadoEliminar, setEstudianteSeleccionadoEliminar] =
    useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const verHistorial = (id: number) => {
    navigate(`/admin/dashboard/reportes/historial?id_estudiante=${id}`, {
      state: { from: "/admin/dashboard/reportes" },
    });
  };

  // ======================
  // CARGAR ESTUDIANTES
  // ======================
  const cargar = async () => {
    const data = await obtenerEstudiantes();
    setEstudiantes(data);
  };

  useEffect(() => {
    cargar();
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logo;

    img.onload = () => {
      console.log("IMG CARGADA");
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      setLogoBase64(canvas.toDataURL("image/png"));
    };
  }, []);

  const dataParaPDF = estudiantes.map((est) => ({
    nombre: est.nombre,
    apellido: est.apellido,
    cedula: est.cedula,
    telefono: est.telefono || "-",
    correo: est.correo || "-",
    // Cambio: datos oficiales incluidos en reportes de estudiantes.
    lugar_nacimiento: est.lugar_nacimiento || "-",
    entidad_federal: est.entidad_federal || "-",
    año: est.año || "Sin Asignar",
    seccion: est.seccion || "Sin Asignar",
  }));

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // HEADER
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 0, pageWidth, 38, "F");

    // LOGO
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 8, -10, 30, 60);
    }

    // TEXTOS
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
    doc.text("REPORTE DE ESTUDIANTES", pageWidth / 2, 30, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.text(
      `Fecha: ${new Date().toLocaleDateString("es-VE")}`,
      pageWidth - 14,
      35,
      { align: "right" },
    );

    // LÍNEA DECORATIVA
    doc.setDrawColor(200, 160, 0);
    doc.setLineWidth(0.8);
    doc.line(14, 40, pageWidth - 14, 40);

    // TABLA
    autoTable(doc, {
      startY: 45,
      head: [
        [
          "Nombre",
          "Apellido",
          "Cédula",
          "Teléfono",
          "Correo",
          "Lugar de nacimiento",
          "Entidad Federal",
          "Año",
          "Sección",
        ],
      ],
      body: dataParaPDF.map((e) => [
        e.nombre,
        e.apellido,
        e.cedula,
        e.telefono,
        e.correo,
        e.lugar_nacimiento,
        e.entidad_federal,
        e.año,
        e.seccion,
      ]),
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 30, 30] },
      headStyles: {
        fillColor: [15, 40, 80],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 26, halign: "center" },
        4: { cellWidth: 45 },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 18, halign: "center" },
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
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        doc.text(`Página ${pageNum}`, pageWidth - 14, pageHeight - 12, {
          align: "right",
        });
      },
    });

    doc.save("reporte_estudiantes.pdf");
  };
  // ======================
  // COLUMNAS
  // ======================
  const columnas: Array<{
    label: string;
    key: keyof FilaEstudiante;
    sortable?: boolean;
    align?: "center";
    width?: number;
    minWidth?: number;
  }> = [
    { label: "Nombre", key: "nombre", sortable: true, width: 150 },
    { label: "Apellido", key: "apellido", sortable: true, width: 150 },
    { label: "Cédula", key: "cedula", sortable: true, width: 130 },
    { label: "Teléfono", key: "telefono", width: 130 },
    { label: "Correo", key: "correo", sortable: true, width: 220 },
    { label: "Lugar de nacimiento", key: "lugar_nacimiento", width: 180 },
    { label: "Entidad Federal", key: "entidad_federal", width: 150 },
    { label: "Año", key: "año", sortable: true, width: 100 },
    { label: "Sección", key: "seccion", width: 100 },
    {
      label: "Opciones",
      key: "acciones",
      align: "center" as const,
      width: 180,
      minWidth: 180,
    },
  ];
  const estudiantesFiltrados = estudiantes.filter((est) => {
    const texto = busqueda.toLowerCase();

    return (
      est.nombre.toLowerCase().includes(texto) ||
      est.apellido.toLowerCase().includes(texto) ||
      est.cedula.toString().includes(texto) ||
      (est.correo || "").toLowerCase().includes(texto) ||
      (est.telefono || "").includes(texto) ||
      // Cambio: permite buscar por datos oficiales de nacimiento.
      (est.lugar_nacimiento || "").toLowerCase().includes(texto) ||
      (est.entidad_federal || "").toLowerCase().includes(texto)
    );
  });

  // ======================
  // FILAS
  // ======================
  const filas: FilaEstudiante[] = estudiantesFiltrados.map((est) => {
    const anioTexto = est.año ? est.año.toString() : "Sin Asignar";
    const seccionTexto = est.seccion || "Sin Asignar";

    // 👉 CONDICIÓN REAL
    const sinAsignar =
      anioTexto === "Sin Asignar" && seccionTexto === "Sin Asignar";

    return {
      nombre: est.nombre,
      apellido: est.apellido,
      cedula: est.cedula,
      telefono: est.telefono || "-",
      correo: est.correo || "-",
      lugar_nacimiento: est.lugar_nacimiento || "-",
      entidad_federal: est.entidad_federal || "-",
      año: anioTexto,
      seccion: seccionTexto,
      acciones: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            width: "100%",
          }}
        >
          {/* EDITAR */}
          <BasicModal
            btnText={<EditarEstudiante />}
            title="Editar estudiante"
            onSuccess={cargar}
            id_estudiante={est.id}
            nombre={est.nombre}
            apellido={est.apellido}
            cedula={est.cedula}
            correo={est.correo}
            telefono={est.telefono}
            lugar_nacimiento={est.lugar_nacimiento}
            entidad_federal={est.entidad_federal}
            id_grado={1}
            buttonProps={{ size: "small", sx: { minWidth: 0, p: 0.5 } }}
          />

          {/* ELIMINAR */}
          <IconButtonMUI
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setEstudianteSeleccionadoEliminar(est.id);
            }}
          >
            <EliminarEstudiante />
          </IconButtonMUI>

          {/* AGREGAR */}
          {sinAsignar && (
            <IconButtonMUI
              size="small"
              onClick={() => setEstudianteSeleccionado(est.id)}
            >
              <AgregarEstudiantes />
            </IconButtonMUI>
          )}

          {/* 👁 VER HISTORIAL */}
          <Tooltip title="Ver historial académico">
            <IconButtonMUI
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                verHistorial(est.id);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButtonMUI>
          </Tooltip>
        </div>
      ),
    };
  });

  // ======================
  // RENDER
  // ======================
  return (
    <>
      {estudiantes.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay estudiantes registrados
          </Typography>
        </Box>
      ) : (
        <>
          <TextField
            label="Buscar estudiante"
            variant="outlined"
            size="small"
            fullWidth
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ marginBottom: 2 }}
          />

          <IconButtonMUI color="primary" onClick={exportarPDF} size="small">
            <Save style={{ marginRight: "10px" }} fontSize="small" />
            exportar PDF
          </IconButtonMUI>

          <SortableTable columns={columnas} rows={filas} />
        </>
      )}
      <OptionsModal
        open={estudianteSeleccionado !== null}
        onClose={() => setEstudianteSeleccionado(null)}
        title="Seleccionar grado para registrar"
        content={
          estudianteSeleccionado && (
            <DisponiblesAgregar
              endPoint="http://localhost:1234/grado"
              id_componente={estudianteSeleccionado}
              mode="estudiantes"
              displayText={(grado) =>
                `${grado.anio} - ${grado.seccion.toUpperCase()}`
              }
              onSuccess={() => {
                cargar();
                setEstudianteSeleccionado(null);
              }}
            />
          )
        }
      />
      <OptionsModal
        open={estudianteSeleccionadoEliminar !== null}
        onClose={() => setEstudianteSeleccionadoEliminar(null)}
        title={"Eliminar Estudiante"}
        content={
          <div style={{ margin: "20px", textAlign: "center" }}>
            Al aceptar estarías eliminando este estudiante
          </div>
        }
        optionalBtn={
          <Button
            variant="success"
            onClick={async (e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!estudianteSeleccionadoEliminar) return;

              const ok = await eliminarEstudiante(
                estudianteSeleccionadoEliminar,
              );

              if (ok) {
                setEstudiantes((prev) =>
                  prev.filter((e) => e.id !== estudianteSeleccionadoEliminar),
                );
              }

              setEstudianteSeleccionadoEliminar(null);
            }}
          >
            Aceptar
          </Button>
        }
      />
    </>
  );
}

export default EstudiantesComponent;
