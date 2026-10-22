import {
  agregarAsignaturaTemplate,
  eliminarAsignaturaTemplate,
  obtenerTemplatePorAnio,
} from "@/api/anioAsignaturaTemplate";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import Typography from "@mui/material/Typography";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import Paper from "@mui/material/Paper";
import TableRow from "@mui/material/TableRow";
import { EliminarEstudiante } from "./svg";
import { Button, TableFooter, Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import VirtualizedList from "./ui/VirtualizedList.tsx";
import ButtonBootstrap from "react-bootstrap/Button";
import {
  actualizarAsignatura,
  crearAsignatura,
  obtenerAsignatura,
} from "@/api/grados";
import type { Asignaturas } from "@/interfaces/interface";

const OptionsModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 420,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
  display: "flex",
  flexDirection: "column",
  gap: 3,
};

function AddAsignaturaModal({
  open,
  onClose,
  onAsignaturaCreada,
}: {
  open: boolean;
  onClose: () => void;
  onAsignaturaCreada: (asignatura: any) => void;
}) {
  const [nombre, setNombre] = useState("");
  const { anio } = useParams();

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="child-modal-title">
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 380,

          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography id="child-modal-title" variant="h6">
          Nueva asignatura
        </Typography>

        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la asignatura"
          style={{
            padding: "8px 10px",
            margin: "15px 0",
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <Button
          variant="contained"
          color="success"
          disabled={!nombre.trim()}
          onClick={async () => {
            try {
              const nuevaAsignatura = await crearAsignatura({
                asignatura: nombre,
              });

              await agregarAsignaturaTemplate(Number(anio), nuevaAsignatura.id);

              onAsignaturaCreada({
                id_asignatura: nuevaAsignatura.id,
                nombre: nuevaAsignatura.asignatura,
              });

              setNombre("");
              onClose();
            } catch (error) {
              console.error("Error al crear asignatura:", error);
            }
          }}
        >
          Guardar
        </Button>

        <Button variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
      </Box>
    </Modal>
  );
}

export default function TemplateAsignaturas() {
  const [template, setTemplate] = useState<Asignaturas[]>([]);
  const [editando, setEditando] = useState<any>(null);
  const [nuevoNombre, setNuevoNombre] = useState("");

  const [openChild, setOpenChild] = useState(false);

  const [asignaturasDisponibles, setAsignaturasDisponibles] = useState<
    Asignaturas[]
  >([]);
  const [open, setOpen] = useState(false);
  const { anio } = useParams();
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  useEffect(() => {
    const fetchTemplate = async () => {
      const template = await obtenerTemplatePorAnio(Number(anio));
      const asignaturas = await obtenerAsignatura();
      setTemplate(template);
      setAsignaturasDisponibles(asignaturas);
    };
    fetchTemplate();
  }, [anio]);
  console.log("asignaturas disp", asignaturasDisponibles);
  console.log("templa", template);
  const asignaturasFiltradas = asignaturasDisponibles.filter(
    (asig) => !template.some((t) => t.id_asignatura === asig.id),
  );

  console.log("asignaturas dispo", asignaturasDisponibles);
  console.log("template response", template);
  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          margin: "0 auto",
          mt: 4,
          maxWidth: "60%",
          boxShadow: 3,
          mx: "auto",
          borderRadius: 2,
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                align="center" // Centrar texto horizontalmente
              >
                Asignaturas
              </TableCell>
              <TableCell
                align="center" // Centrar texto horizontalmente
              >
                Eliminar
              </TableCell>
              <TableCell
                align="center" // Centrar texto horizontalmente
              >
                Editar
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {template.map((asignatura: any) => (
              <TableRow
                key={asignatura.id}
                sx={{
                  "&:last-child td, &:last-child th": { border: 0 },
                  "&:hover": {
                    backgroundColor: "rgba(127, 126, 126, 0.47)",
                    transition: "background-color 0.25s ease-in-out",
                  },
                }}
              >
                <TableCell
                  align="center" // Centrar contenido horizontalmente
                  sx={{
                    verticalAlign: "middle", // Centrar verticalmente
                  }}
                >
                  {asignatura.nombre}
                </TableCell>
                <TableCell align="center">
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      onClick={async () => {
                        await eliminarAsignaturaTemplate(
                          Number(anio),
                          asignatura.id_asignatura,
                        );
                        setTemplate((prev: any) =>
                          prev.filter(
                            (a: any) =>
                              a.id_asignatura !== asignatura.id_asignatura,
                          ),
                        );
                      }}
                    >
                      <EliminarEstudiante />
                    </Button>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Button
                    onClick={() => {
                      setEditando(asignatura);
                      setNuevoNombre(asignatura.nombre);
                    }}
                  >
                    ✏️
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={3}
                sx={{ py: 2, borderTop: 1, borderColor: "divider" }}
              >
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <Button
                    onClick={handleOpen}
                    variant="contained"
                    sx={{
                      px: 3,
                      py: 0.75,
                      fontWeight: 500,
                      textTransform: "none",
                      fontSize: "0.9375rem",
                    }}
                  >
                    Agregar Asignatura
                  </Button>
                </Box>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={OptionsModalStyle}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Agregar asignatura a la plantilla
          </Typography>
          <div>
            {asignaturasFiltradas.length > 0 ? (
              <VirtualizedList
                onItemClick={async (item: Asignaturas) => {
                  await agregarAsignaturaTemplate(Number(anio), item.id);

                  setTemplate((prev: any) => [
                    ...prev,
                    {
                      id_asignatura: item.id,
                      nombre: item.nombre,
                    },
                  ]);

                  handleClose();
                }}
                items={asignaturasFiltradas}
                height={Math.min(asignaturasFiltradas.length, 4) * 46}
                width={360}
                itemHeight={46}
                getItemText={(item: any) => item.nombre}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No hay asignaturas disponibles para agregar
              </Typography>
            )}
          </div>
          <Button
            variant="contained"
            color="success"
            onClick={() => setOpenChild(true)}
          >
            Agregar nueva asignatura
          </Button>
          <AddAsignaturaModal
            open={openChild}
            onClose={() => setOpenChild(false)}
            onAsignaturaCreada={(asignatura) => {
              setTemplate((prev: any) => [...prev, asignatura]);
              setOpenChild(false);
              handleClose();
            }}
          />

          <ButtonBootstrap variant="danger" onClick={handleClose}>
            Cerrar
          </ButtonBootstrap>
        </Box>
      </Modal>
      <Modal open={!!editando} onClose={() => setEditando(null)}>
        <Box sx={OptionsModalStyle}>
          <Typography variant="h6">Editar asignatura</Typography>

          <input
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />

          <Button
            variant="contained"
            onClick={async () => {
              await actualizarAsignatura(editando.id_asignatura, nuevoNombre);

              setTemplate((prev) =>
                prev.map((a) =>
                  a.id_asignatura === editando.id_asignatura
                    ? { ...a, nombre: nuevoNombre }
                    : a,
                ),
              );

              setEditando(null);
            }}
          >
            Guardar
          </Button>
        </Box>
      </Modal>
    </>
  );
}
