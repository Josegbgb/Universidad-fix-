import { useEffect, useState } from "react";
import { SortableTable } from "./ui/Table";
import ButtonMUI from "@mui/material/Button";
import { Button } from "react-bootstrap";
import { OptionsModal } from "./ui/BasicModal";
import TextField from "@mui/material/TextField";

import { AlertDemo } from "./Alert";
import {
  obtenerAdministradores,
  eliminarAdministrador,
  restaurarAdministrador,
} from "@/api/administradores";
import type { Administrador } from "../interfaces/interface";
import { EditarEstudiante, EliminarEstudiante } from "./svg";
import { FormularioModal } from "./FormularioModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import IconButton from "@mui/material/IconButton";
import { Save } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
type FilaAdmin = {
  nombre: string;
  apellido: string;
  cedula: number;
  telefono: string;
  correo: string;
  estado: string;
  fecha: string;
  acciones: React.ReactNode;
};

function AdministradoresComponent() {
  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [itemEliminar, setItemEliminar] = useState<Administrador | null>(null);
  const [itemEditar, setItemEditar] = useState<Administrador | null>(null);
  const [openCrear, setOpenCrear] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const [showAlert, setShowAlert] = useState<
    "" | "eliminar" | "actualizar" | "agregar"
  >("");
  const [logoBase64, setLogoBase64] = useState<string>("");

  // ======================
  // CARGAR
  // ======================
  const cargar = async () => {
    const data = await obtenerAdministradores();
    setAdmins(data);
  };

  useEffect(() => {
    cargar();
    const img = new Image();
    img.src = "../../public/LOGO_LICEO.png"; // ⚠️ IMPORTANTE: usar ruta desde public

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);

      const base64 = canvas.toDataURL("image/png");
      setLogoBase64(base64);
    };
  }, []);
  const dataParaPDF = admins.map((adm) => ({
    nombre: adm.nombre,
    apellido: adm.apellido,
    cedula: adm.cedula,
    telefono: adm.telefono || "-",
    correo: adm.correo || "-",
    direccion: adm.direccion,
  }));

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ======================
    // HEADER (IGUAL QUE ESTUDIANTES)
    // ======================
    doc.setFillColor(15, 40, 80);
    doc.rect(0, 0, pageWidth, 38, "F");

    // LOGO (AHORA SÍ FUNCIONA)
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
    doc.text("REPORTE DE ADMINISTRADORES", pageWidth / 2, 30, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.text(
      `Fecha: ${new Date().toLocaleDateString("es-VE")}`,
      pageWidth - 14,
      35,
      { align: "right" },
    );

    // LÍNEA
    doc.setDrawColor(200, 160, 0);
    doc.setLineWidth(0.8);
    doc.line(14, 40, pageWidth - 14, 40);

    // ======================
    // TABLA (SOLO TUS DATOS)
    // ======================
    autoTable(doc, {
      tableWidth: "auto",
      margin: { left: 14, right: 14 },
      startY: 45,
      head: [
        ["Nombre", "Apellido", "Cédula", "Teléfono", "Correo", "Dirección"],
      ],
      body: dataParaPDF.map((a) => [
        a.nombre ?? "-",
        a.apellido ?? "-",
        a.cedula ?? "-",
        a.telefono ?? "-",
        a.correo ?? "-",
        a.direccion ?? "-",
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 3,
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

    doc.save("reporte_administradores.pdf");
  };

  // ======================
  // COLUMNAS
  // ======================
  const columnas = [
    { label: "Nombre", key: "nombre", sortable: true, width: 140 },
    { label: "Apellido", key: "apellido", sortable: true, width: 140 },
    { label: "Cédula", key: "cedula", sortable: true, width: 120 },
    { label: "Teléfono", key: "telefono", width: 130 },
    { label: "Correo", key: "correo", width: 200 },
    { label: "Estado", key: "estado", width: 120 },
    { label: "Fecha", key: "fecha", width: 140 },
    {
      label: "Opciones",
      key: "acciones",
      align: "center" as const,
      width: 150,
      minWidth: 150,
    },
  ] as const;
  const adminsFiltrados = admins.filter((admin) => {
    const texto = busqueda.toLowerCase();

    const estado = admin.deleted_at ? "inactivo" : "activo";

    const fecha = admin.created_at
      ? new Date(admin.created_at).toLocaleDateString()
      : "";

    return (
      admin.nombre.toLowerCase().includes(texto) ||
      admin.apellido.toLowerCase().includes(texto) ||
      admin.cedula.toString().includes(texto) ||
      (admin.correo || "").toLowerCase().includes(texto) ||
      (admin.telefono || "").includes(texto) ||
      estado.includes(texto) ||
      fecha.includes(texto)
    );
  });

  // ======================
  // FILAS
  // ======================
  const filas: FilaAdmin[] = adminsFiltrados.map((admin) => {
    const activo = !admin.deleted_at;

    return {
      nombre: admin.nombre,
      apellido: admin.apellido,
      cedula: admin.cedula,
      telefono: admin.telefono || "-",
      correo: admin.correo || "-",
      estado: activo ? "Activo" : "Inactivo",
      fecha: admin.created_at
        ? new Date(admin.created_at).toLocaleDateString()
        : "-",

      acciones: (
        <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
          {/* EDITAR */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setItemEditar(admin);
            }}
          >
            <EditarEstudiante />
          </ButtonMUI>

          {/* ELIMINAR / RESTAURAR */}
          <ButtonMUI
            size="small"
            sx={{ minWidth: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setItemEliminar(admin);
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
      {admins.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            px: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay mas administradores registrados
          </Typography>
        </Box>
      ) : (
        <>
          <TextField
            label="Buscar administrador"
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

      {/* ======================
          MODAL CREAR
      ====================== */}
      <OptionsModal
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        title="Nuevo administrador"
        content={
          <FormularioModal
            campos={["Nombre", "Apellido", "Cedula", "Telefono", "Correo"]}
            mode="administradores"
            onSuccess={async () => {
              await cargar();
              setOpenCrear(false);
              setShowAlert("agregar");
            }}
          />
        }
      />

      {/* ======================
          MODAL EDITAR
      ====================== */}
      <OptionsModal
        wide
        open={itemEditar !== null}
        onClose={() => setItemEditar(null)}
        title={`Editar administrador`}
        content={
          itemEditar && (
            <FormularioModal
              campos={["Nombre", "Apellido", "Cedula", "Telefono", "Correo"]}
              dataScroll={admins}
              id_to_rel={itemEditar.id}
              mode="editar administrador"
              onSuccess={async () => {
                await cargar();
                setItemEditar(null);
                setShowAlert("actualizar");
              }}
            />
          )
        }
      />

      {/* ======================
          MODAL ELIMINAR / RESTORE
      ====================== */}
      <OptionsModal
        open={itemEliminar !== null}
        onClose={() => setItemEliminar(null)}
        title="Cambiar estado"
        content={
          <div style={{ padding: 10 }}>
            ¿Deseas activar/desactivar este administrador?
          </div>
        }
        optionalBtn={
          <Button
            variant="warning"
            onClick={async () => {
              if (!itemEliminar) return;

              if (itemEliminar.deleted_at) {
                await restaurarAdministrador(itemEliminar.id);
              } else {
                await eliminarAdministrador(itemEliminar.id);
              }

              await cargar();
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

export default AdministradoresComponent;
