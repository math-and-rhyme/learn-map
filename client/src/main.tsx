import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// import { createRoot } from "react-dom/client";
// import App from "./App";
// import "./index.css";

// createRoot(document.getElementById("root")!).render(<App />);
