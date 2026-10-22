import { useEffect, useState, type ReactNode } from "react";
import { SortableTable } from "./ui/Table";
import { AlertDemo } from "./Alert.tsx";
import {
  obtenerProfesores,
  asignaturasParaProfesor,
  eliminarProfesor,
  profesor_asignatura_rel,
} from "../api/profesores";
import logo from "../../public/LOGO_LICEO.png";

import type { Profesores } from "../interfaces/interface";
import { EditarEstudiante, EliminarEstudiante } from "./svg.tsx";
import ButtonMUI from "@mui/material/Button";
import { Button } from "react-bootstrap";
import { OptionsModal } from "./ui/BasicModal.tsx";
import { FormularioModal } from "./FormularioModal.tsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import IconButton from "@mui/material/IconButton";
import { Save } from "@mui/icons-material";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
type FilaProfesor = {
  nombre: string;
  apellido: string;
  cedula: number;
  telefono: string;
  correo: string;
  direccion: string;
  asignaturas: string;
  asignaturasConGrados: string; // ← NUEVA: asignaturas con grados
  // Cambio: la tabla renderiza botones de editar/eliminar dentro de la fila.
  acciones: ReactNode;
};

function ProfesoresComponent() {
  const [logoBase64, setLogoBase64] = useState<string>("");

  const [profesores, setProfesores] = useState<Profesores[]>([]);
  const [itemEliminarProfesor, setItemEliminarProfesor] =
    useState<Profesores | null>(null);
  const [itemEditarProfesor, setItemEditarProfesor] =
    useState<Profesores | null>(null);
  const [showAlert, setShowAlert] = useState<"" | "eliminar" | "actualizar">(
    "",
  );
  const [asignaturasProfesor, setAsignaturasProfesor] = useState<
    Record<number, string>
  >({});
  const [relacionesProfesor, setRelacionesProfesor] = useState<
    Record<number, any[]>
  >({});
  const [busqueda, setBusqueda] = useState("");

  const cargar = async () => {
    const data = await obtenerProfesores();
    setProfesores(data);

    // cargar asignaturas de cada profesor
    const mapa: Record<number, string> = {};
    const mapaRelaciones: Record<number, any[]> = {};

    for (const prof of data) {
      const asignaturas = await asignaturasParaProfesor(prof.id);

      mapa[prof.id] =
        asignaturas?.map((a: any) => a.nombre).join(", ") || "Sin asignaturas";
      const relaciones = await profesor_asignatura_rel(prof.id);
      mapaRelaciones[prof.id] = relaciones || [];
    }

    setAsignaturasProfesor(mapa);
    setRelacionesProfesor(mapaRelaciones);
  };

  useEffect(() => {
    cargar();
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
  }, []);

  const dataParaPDF = profesores.map((prof) => {
    const relaciones = relacionesProfesor[prof.id] || [];
    const asignaturasSimples =
      asignaturasProfesor[prof.id] || "Sin asignaturas Capaces definidas";

    // Formatear las relaciones: "Matemáticas - 1er Año A"
    const asignaturasConGrados =
      relaciones
        .map((r: any) => {
          if (r.asignatura === "Sin asignar") return "Sin asignar";
          return `${r.asignatura} - ${r.anio}° ${r.seccion}`;
        })
        .join("\n") || "Sin asignaturas";

    return {
      nombre: prof.nombre,
      apellido: prof.apellido,
      cedula: prof.cedula,
      telefono: prof.telefono || "-",
      correo: prof.correo || "-",
      direccion: prof.direccion,
      asignaturas_simples: asignaturasSimples,
      asignaturas_grados: asignaturasConGrados,
    };
  });

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ======================
    // HEADER (MISMO DISEÑO)
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
    doc.text("REPORTE DE PROFESORES", pageWidth / 2, 30, {
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
    // TABLA (DATOS PROFESORES)
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
          "Asignaturas Capaces",
          "Asignaturas y Grados",
        ],
      ],
      body: dataParaPDF.map((p) => [
        p.nombre ?? "",
        p.apellido ?? "",
        p.cedula ?? "",
        p.telefono ?? "",
        p.correo ?? "",
        p.direccion ?? "",
        p.asignaturas_simples ?? "",
        p.asignaturas_grados ?? "",
      ]),
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2, textColor: [30, 30, 30] },
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

    doc.save("reporte_profesores.pdf");
  };

  // ======================
  // COLUMNAS
  // ======================

  const columnas = [
    { label: "Nombre", key: "nombre", sortable: true, width: 130 },
    { label: "Apellido", key: "apellido", sortable: true, width: 130 },
    { label: "Cédula", key: "cedula", sortable: true, width: 130 },
    { label: "Teléfono", key: "telefono", width: 130 },
    { label: "Correo", key: "correo", width: 150 },
    { label: "Dirección", key: "direccion", width: 150 },
    { label: "Asignaturas Capaces", key: "asignaturas", width: 150 },
    {
      label: "Asignaturas con Grados",
      key: "asignaturasConGrados",
      width: 150,
    },
    {
      label: "Opciones",
      key: "acciones",
      align: "center" as const,
      width: 160,
      minWidth: 160,
    },
  ] as const;

  // ======================
  // FILAS
  // ======================

  const profesoresFiltrados = profesores.filter((prof) => {
    const texto = busqueda.toLowerCase();

    return (
      prof.nombre.toLowerCase().includes(texto) ||
      prof.apellido.toLowerCase().includes(texto) ||
      prof.cedula.toString().includes(texto) ||
      (prof.correo || "").toLowerCase().includes(texto) ||
      (prof.telefono || "").includes(texto) ||
      (prof.direccion || "").toLowerCase().includes(texto) ||
      (asignaturasProfesor[prof.id] || "").toLowerCase().includes(texto)
    );
  });

  const filas: FilaProfesor[] = profesoresFiltrados.map((prof) => {
    // Formatear las relaciones con grados para mostrar en la tabla
    const relaciones = relacionesProfesor[prof.id] || [];
    const asignaturasConGrados =
      relaciones.length > 0
        ? relaciones
            .map((r: any) => {
              if (r.asignatura === "Sin asignar") return "Sin asignar";
              return `${r.asignatura} - ${r.anio}° ${r.seccion}`;
            })
            .join(", ") // Usa coma en vez de salto de línea para la tabla
        : "Sin asignaturas";

    return {
      nombre: prof.nombre,
      apellido: prof.apellido,
      cedula: prof.cedula,
      telefono: prof.telefono || "-",
      correo: prof.correo || "-",
      direccion: prof.direccion || "-",
      asignaturas: asignaturasProfesor[prof.id] || "Cargando...",
      asignaturasConGrados: asignaturasConGrados, // ← NUEVO campo
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
              setItemEditarProfesor(prof);
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
              setItemEliminarProfesor(prof);
            }}
          >
            <EliminarEstudiante />
          </ButtonMUI>
        </div>
      ),
    };
  });

  return (
    <>
      {profesores.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay profesores registrados
          </Typography>
        </Box>
      ) : (
        <>
          <TextField
            label="Buscar profesor"
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
        wide
        open={itemEditarProfesor !== null}
        onClose={() => setItemEditarProfesor(null)}
        title={`Editar Profesor ${itemEditarProfesor?.nombre ?? ""}`}
        content={
          itemEditarProfesor && (
            <FormularioModal
              dataScroll={profesores}
              id_to_rel={itemEditarProfesor.id}
              onSuccess={async () => {
                await cargar();
                setItemEditarProfesor(null);
                setShowAlert("actualizar");
              }}
              mode="editar profesor"
              campos={[
                "Nombre",
                "Apellido",
                "Cedula",
                "Telefono",
                "Correo",
                "Direccion",
              ]}
            />
          )
        }
      />
      <OptionsModal
        open={itemEliminarProfesor !== null}
        onClose={() => setItemEliminarProfesor(null)}
        title={`Eliminar Profesor ${itemEliminarProfesor?.nombre ?? ""}`}
        content={
          <div style={{ padding: "10px" }}>
            Al aceptar se eliminará el profesor del sistema.
            <br />
            Esta acción puede restaurarse posteriormente.
          </div>
        }
        optionalBtn={
          <Button
            variant="warning"
            onClick={async () => {
              if (!itemEliminarProfesor) return;

              await eliminarProfesor(itemEliminarProfesor.id);

              setProfesores((prev) =>
                prev.filter((p) => p.id !== itemEliminarProfesor.id),
              );

              setItemEliminarProfesor(null);
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

export default ProfesoresComponent;
