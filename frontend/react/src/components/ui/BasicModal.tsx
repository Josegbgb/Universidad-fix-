import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",

  bgcolor: "background.paper",
  border: "2px solid #000",
  borderRadius: "10px",
  boxShadow: 24,
  p: 4,
};

interface BasicModalProps {
  btnText?: string | React.ReactNode;
  title?: string;
  content?: React.ReactNode;
}

interface OptionsModalProps extends BasicModalProps {
  optionalBtn?: React.ReactNode;
  open: boolean;
  onClose: () => void;
  wide?: boolean; // 👈 NUEVO PROP
  width?: number | string;
}
//
//
//
export default function BasicModal({
  btnText,
  title,
  content,
}: BasicModalProps) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <div>
      <Button onClick={handleOpen}>{btnText}</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            {title}
          </Typography>
          {content}
        </Box>
      </Modal>
    </div>
  );
}
//
//
//
export function OptionsModal({
  title,
  content,
  optionalBtn,
  onClose,
  open,
  wide = false,
  width,
}: OptionsModalProps) {
  React.useEffect(() => {
    const close = () => onClose();
    window.addEventListener("closeModal", close);
    return () => window.removeEventListener("closeModal", close);
  }, []);

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",

    width: width || (wide ? "90vw" : "100%"),
    maxWidth: wide ? 1100 : 480,
    maxHeight: "90vh",

    bgcolor: "background.paper",
    borderRadius: 3,
    boxShadow: 24,

    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>

        {/* CONTENT */}
        <Box
          sx={{
            px: 3,
            py: 3,
            overflowY: "auto",
          }}
        >
          {content}
        </Box>

        {/* FOOTER */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          {optionalBtn}

          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            sx={{
              textTransform: "none",
              borderRadius: 2,
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

//
//
//
const NestedModalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: "0px 10px 30px rgba(0,0,0,0.15)",

  pt: 2,
  px: 4,
  pb: 3,
};

function ChildModal() {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <Button onClick={handleOpen}>Open Child Modal</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="child-modal-title"
        aria-describedby="child-modal-description"
      >
        <Box sx={{ ...NestedModalStyle, width: 1000 }}>
          <h2 id="child-modal-title">Text in a child modal</h2>
          <p id="child-modal-description">
            Lorem ipsum, dolor sit amet consectetur adipisicing elit.
          </p>
          <Button onClick={handleClose}>Close Child Modal</Button>
        </Box>
      </Modal>
    </React.Fragment>
  );
}

export function NestedModal({
  btnText,
  Title,
  Content,
}: {
  btnText: string;
  Title: string;
  Content: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div>
      <Button onClick={handleOpen}>{btnText}</Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="parent-modal-title"
        aria-describedby="parent-modal-description"
      >
        <Box sx={{ ...NestedModalStyle, width: 400 }}>
          <h5 id="parent-modal-title">{Title}</h5>
          {Content}
          <ChildModal />
        </Box>
      </Modal>
    </div>
  );
}
