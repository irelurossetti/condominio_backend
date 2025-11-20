import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";   // base mínimo
import "./App.css";     // estilos del layout + componentes

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
