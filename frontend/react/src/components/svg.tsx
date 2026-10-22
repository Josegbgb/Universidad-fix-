import estilos from "../styles/grados.module.css";
export function EliminarEstudiante() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 14 14"
      width="14px"
      height="14px"
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}

export function AgregarEstudiantes() {
  return (
    <svg
      width="18px"
      height="18px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1z"
        fill="currentColor"
      />
    </svg>
  );
}

export function EditarEstudiante() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="16px"
      height="16px"
    >
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83l3.75 3.75z"
      ></path>
    </svg>
  );
}

export function EliminadoAlert() {
  return (
    <svg
      fill="#000000"
      width="16px"
      height="16px"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5.755,20.283,4,8H20L18.245,20.283A2,2,0,0,1,16.265,22H7.735A2,2,0,0,1,5.755,20.283ZM21,4H16V3a1,1,0,0,0-1-1H9A1,1,0,0,0,8,3V4H3A1,1,0,0,0,3,6H21a1,1,0,0,0,0-2Z" />
    </svg>
  );
}

export function FormularioAgregar() {
  return (
    <svg
      fill="#000000"
      width="15x"
      height="15px"
      viewBox="0 0 36 36"
      version="1.1"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <title>form-line</title>
      <path
        d="M21,12H7a1,1,0,0,1-1-1V7A1,1,0,0,1,7,6H21a1,1,0,0,1,1,1v4A1,1,0,0,1,21,12ZM8,10H20V7.94H8Z"
        className="clr-i-outline clr-i-outline-path-1"
      ></path>
      <path
        d="M21,14.08H7a1,1,0,0,0-1,1V19a1,1,0,0,0,1,1H18.36L22,16.3V15.08A1,1,0,0,0,21,14.08ZM20,18H8V16H20Z"
        className="clr-i-outline clr-i-outline-path-2"
      ></path>
      <path
        d="M11.06,31.51v-.06l.32-1.39H4V4h20V14.25L26,12.36V3a1,1,0,0,0-1-1H3A1,1,0,0,0,2,3V31a1,1,0,0,0,1,1h8A3.44,3.44,0,0,1,11.06,31.51Z"
        className="clr-i-outline clr-i-outline-path-3"
      ></path>
      <path
        d="M22,19.17l-.78.79A1,1,0,0,0,22,19.17Z"
        className="clr-i-outline clr-i-outline-path-4"
      ></path>
      <path
        d="M6,26.94a1,1,0,0,0,1,1h4.84l.3-1.3.13-.55,0-.05H8V24h6.34l2-2H7a1,1,0,0,0-1,1Z"
        className="clr-i-outline clr-i-outline-path-5"
      ></path>
      <path
        d="M33.49,16.67,30.12,13.3a1.61,1.61,0,0,0-2.28,0h0L14.13,27.09,13,31.9a1.61,1.61,0,0,0,1.26,1.9,1.55,1.55,0,0,0,.31,0,1.15,1.15,0,0,0,.37,0l4.85-1.07L33.49,19a1.6,1.6,0,0,0,0-2.27ZM18.77,30.91l-3.66.81L16,28.09,26.28,17.7l2.82,2.82ZM30.23,19.39l-2.82-2.82L29,15l2.84,2.84Z"
        className="clr-i-outline clr-i-outline-path-6"
      ></path>
      <rect x="0" y="0" width="36" height="36" fill-opacity="0" />
    </svg>
  );
}

export function Lupa() {
  return (
    <svg className={estilos.icon} aria-hidden="true" viewBox="0 0 24 24">
      <g>
        <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z"></path>
      </g>
    </svg>
  );
}
export function Trash() {
  return (
    <svg
      fill="#000000"
      width="18px"
      height="18px"
      viewBox="-3 -2 24 24"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMinYMin"
      className="jam jam-trash"
    >
      <path d="M6 2V1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h4a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-.133l-.68 10.2a3 3 0 0 1-2.993 2.8H5.826a3 3 0 0 1-2.993-2.796L2.137 7H2a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4zm10 2H2v1h14V4zM4.141 7l.687 10.068a1 1 0 0 0 .998.932h6.368a1 1 0 0 0 .998-.934L13.862 7h-9.72zM7 8a1 1 0 0 1 1 1v7a1 1 0 0 1-2 0V9a1 1 0 0 1 1-1zm4 0a1 1 0 0 1 1 1v7a1 1 0 0 1-2 0V9a1 1 0 0 1 1-1z" />
    </svg>
  );
}
export function Libro() {
  return (
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width="16px"
      height="16px"
      viewBox="0 0 64 64"
      enable-background="new 0 0 64 64"
      xmlSpace="preserve"
    >
      <rect
        x="7"
        y="1"
        fill="none"
        stroke="#000000"
        stroke-width="2"
        stroke-miterlimit="10"
        width="46"
        height="62"
      />
      <line
        fill="none"
        stroke="#000000"
        stroke-width="2"
        stroke-miterlimit="10"
        x1="15"
        y1="63"
        x2="15"
        y2="2"
      />
      <line
        fill="none"
        stroke="#000000"
        stroke-width="2"
        stroke-miterlimit="10"
        x1="20"
        y1="15"
        x2="48"
        y2="15"
      />
      <line
        fill="none"
        stroke="#000000"
        stroke-width="2"
        stroke-miterlimit="10"
        x1="20"
        y1="21"
        x2="48"
        y2="21"
      />
    </svg>
  );
}
<script src=""></script>;
