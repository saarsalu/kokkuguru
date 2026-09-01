import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./kokkuguru/index.css";
import App from "./kokkuguru/App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
