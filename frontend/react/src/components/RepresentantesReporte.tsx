import { useEffect, useState } from "react";
import { SortableTable } from "./ui/Table";
import ButtonMUI from "@mui/material/Button";
import { Button } from "react-bootstrap";
import logo from "../../public/LOGO_LICEO.png";

import { OptionsModal } from "./ui/BasicModal";
import { AlertDemo } from "./Alert";
import TextField from "@mui/material/TextField";

import {
  obtenerRepresentantes,
  eliminarRepresentantes,
} from "../api/representantes";

import type { Representantes } from "../interfaces/interface";

import { EditarEstudiante, EliminarEstudiante } from "./svg";
import { FormularioModal } from "./FormularioModal";
import IconButton from "@mui/material/IconButton";
import { Save } from "@mui/icons-material";
import jsPDF from "jspdf";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import autoTable from "jspdf-autotable";

type FilaRepresentante = {
  nombre: string;

  cedula: number;
  telefono: string;
  correo: string;
  direccion: string;
  estudiante: string;
  grado: string;
  parentesco: string;
  acciones: React.ReactNode;
};

function RepresentantesComponent() {
  const [representantes, setRepresentantes] = useState<Representantes[]>([]);
  const [itemEliminar, setItemEliminar] = useState<Representantes | null>(null);
  const [itemEditarRepresentante, setItemEditarRepresentante] =
    useState<Representantes | null>(null);

  const [showAlert, setShowAlert] = useState<"" | "eliminar" | "actualizar">(
    "",
  );
  const [busqueda, setBusqueda] = useState("");
  const [logoBase64, setLogoBase64] = useState<string>("");

  // ======================
  // CARGAR
  // ======================

  const cargar = async () => {
    const data = await obtenerRepresentantes();
    setRepresentantes(data);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logo;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      setLogoBase64(canvas.toDataURL("image/png"));
    };
  };

  useEffect(() => {
    cargar();
  }, []);

  const dataParaPDF = representantes.map((rep) => ({
    nombre: rep.nombre,
    apellido: rep.apellido,
    cedula: rep.cedula,
    telefono: rep.telefono || "-",
    correo: rep.correo || "-",
    direccion: rep.direccion,
    estudiante:
      rep.nombre_estudiante && rep.apellido_estudiante
        ? `${rep.nombre_estudiante} ${rep.apellido_estudiante}`
        : "Sin estudiante",
    Grado:
      rep.grado_anio && rep.grado_seccion
        ? `${rep.grado_anio}° ${rep.grado_seccion}`
        : "Sin asignar",
    parentesco_con_estudiante: rep.parentesco,
  }));

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ======================
    // HEADER (MISMO TEMPLATE)
    // ======================
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
    doc.text("REPORTE DE REPRESENTANTES", pageWidth / 2, 30, {
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

    // ======================
    // TABLA (TUS DATOS)
    // ======================
    autoTable(doc, {
      startY: 45,
      head: [
        [
          "Nombre",
          "Apellido",
          "Cédula",
          "Teléfono",
          "Correo",
          "Dirección",
          "Estudiante",
          "Grado",
          "Parentesco",
        ],
      ],
      body: dataParaPDF.map((e) => [
        e.nombre,
        e.apellido,
        e.cedula,
        e.telefono,
        e.correo,
        e.direccion,
        e.estudiante,
        e.Grado,
        e.parentesco_con_estudiante,
      ]),
      theme: "grid",

      styles: {
        fontSize: 7, // 👈 importante por muchas columnas
        cellPadding: 2,
        textColor: [30, 30, 30],
      },

      headStyles: {
        fillColor: [15, 40, 80],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },

      alternateRowStyles: { fillColor: [240, 245, 255] },

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

    doc.save("reporte_representantes.pdf");
  };

  // ======================
  // COLUMNAS
  // ======================

  const columnas = [
    { label: "Nombre", key: "nombre", sortable: true, width: 130 },
    { label: "Cédula", key: "cedula", sortable: true, width: 130 },
    { label: "Teléfono", key: "telefono", width: 130 },
    { label: "Correo", key: "correo", width: 150 },
    { label: "Direccion", key: "direccion", width: 150 },
    { label: "Estudiante", key: "estudiante", width: 130 },
    { label: "Grado", key: "grado", width: 120 },
    { label: "Parentesco", key: "parentesco", width: 120 },
    {
      label: "Opciones",
      key: "acciones",
      align: "center" as const,
      width: 130,
      minWidth: 160,
    },
  ] as const;
  const representantesFiltrados = representantes.filter((rep) => {
    const texto = busqueda.toLowerCase();

    const nombreCompleto = `${rep.nombre} ${rep.apellido}`.toLowerCase();

    const estudiante =
      rep.nombre_estudiante && rep.apellido_estudiante
        ? `${rep.nombre_estudiante} ${rep.apellido_estudiante}`.toLowerCase()
        : "";

    const grado =
      rep.grado_anio && rep.grado_seccion
        ? `${rep.grado_anio} ${rep.grado_seccion}`.toLowerCase()
        : "";

    return (
      nombreCompleto.includes(texto) ||
      rep.cedula.toString().includes(texto) ||
      (rep.correo || "").toLowerCase().includes(texto) ||
      (rep.telefono || "").includes(texto) ||
      estudiante.includes(texto) ||
      grado.includes(texto) ||
      (rep.parentesco || "").toLowerCase().includes(texto)
    );
  });

  // ======================
  // FILAS
  // ======================

  const filas: FilaRepresentante[] = representantesFiltrados.map((rep) => {
    const estudiante =
      rep.nombre_estudiante && rep.apellido_estudiante
        ? `${rep.nombre_estudiante} ${rep.apellido_estudiante}`
        : "Sin estudiante";

    const grado =
      rep.grado_anio && rep.grado_seccion
        ? `${rep.grado_anio}° ${rep.grado_seccion}`
        : "Sin asignar";

    return {
      nombre: rep.nombre + " " + rep.apellido,
      cedula: rep.cedula,
      telefono: rep.telefono || "-",
      correo: rep.correo || "-",
      direccion: rep.direccion || "-",
      estudiante,
      grado,
      parentesco: rep.parentesco || "-",

      acciones: (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
          }}
        >
          {/* EDITAR */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setItemEditarRepresentante(rep);
            }}
          >
            <EditarEstudiante />
          </ButtonMUI>

          {/* ELIMINAR */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setItemEliminar(rep);
            }}
          >
            <EliminarEstudiante />
          </ButtonMUI>
        </div>
      ),
    };
  });

  // ======================
  // RENDER
  // ======================

  return (
    <>
      {representantes.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay representantes registrados
          </Typography>
        </Box>
      ) : (
        <>
          <TextField
            label="Buscar representante"
            variant="outlined"
            size="small"
            fullWidth
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            sx={{ marginBottom: 2 }}
          />

          <IconButton color="primary" onClick={exportarPDF} size="small">
            <Save style={{ marginRight: "10px" }} fontSize="small" />
            exportar PDF
          </IconButton>
          <SortableTable columns={columnas} rows={filas} />
        </>
      )}

      <OptionsModal
        title={`Editar Representante `}
        wide
        open={itemEditarRepresentante !== null}
        onClose={() => setItemEditarRepresentante(null)}
        content={
          <FormularioModal
            campos={[
              "Nombre",
              "Apellido",
              "Cedula",
              "Telefono",
              "Correo",
              "Direccion",
            ]}
            dataScroll={representantes}
            onSuccess={async () => {
              await cargar();
              setItemEditarRepresentante(null);
              setShowAlert("actualizar");
            }}
            mode="editar representante"
            id_to_rel={itemEditarRepresentante?.id}
          />
        }
      />

      {/* MODAL ELIMINAR */}

      <OptionsModal
        open={itemEliminar !== null}
        onClose={() => setItemEliminar(null)}
        title={`Eliminar Representante ${itemEliminar?.nombre ?? ""}`}
        content={
          <div style={{ padding: "10px" }}>
            Al aceptar se eliminará el representante del sistema.
            <br />
            Esta acción puede restaurarse posteriormente.
          </div>
        }
        optionalBtn={
          <Button
            variant="warning"
            onClick={async () => {
              if (!itemEliminar) return;

              await eliminarRepresentantes(itemEliminar.id);

              setRepresentantes((prev) =>
                prev.filter((r) => r.id !== itemEliminar.id),
              );

              setItemEliminar(null);
              setShowAlert("eliminar");
            }}
          >
            Aceptar
          </Button>
        }
      />

      {showAlert && (
        <AlertDemo
          action={showAlert}
          duration={2000}
          onClose={() => setShowAlert("")}
        />
      )}
    </>
  );
}

export default RepresentantesComponent;
