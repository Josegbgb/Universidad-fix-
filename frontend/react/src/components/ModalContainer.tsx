import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import estilos from "../styles/grados.module.css";

interface Props {
  show: boolean;
  onClose: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  header: React.ReactNode;
  children: React.ReactNode;
  optionalBtn?: React.ReactNode;
}
function ModalContainer({
  show,
  onClose,
  header,
  children,
  optionalBtn,
}: Props) {
  if (!show) return null;
  return (
    <div className={`modal show ${estilos.modal_container}`}>
      <Modal.Dialog>
        <Modal.Header> {header}</Modal.Header>

        {children}

        <Modal.Footer>
          {optionalBtn && optionalBtn}
          <Button variant="danger" onClick={onClose}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </div>
  );
}

export default ModalContainer;
