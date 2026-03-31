import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Import debug utilities for development
if (import.meta.env.DEV) {
  import("./lib/debug-sheets.ts");
  console.log("💡 Debug utilities loaded. Use window.sheetsDebug.runFullDiagnostic() to troubleshoot");
}

createRoot(document.getElementById("root")!).render(<App />);
