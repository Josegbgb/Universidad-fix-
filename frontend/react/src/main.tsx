import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import App from "./App.tsx";
import React from "react";

import { AuthProvider } from "./Auth/AuthProvider.tsx";
import { installAuthFetch } from "./api/installAuthFetch.ts";

// Cambio: las llamadas al backend reutilizan el token guardado en login.
installAuthFetch();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>

  /**
 <BrowserRouter>
    <App />
  </BrowserRouter>
   */
);
