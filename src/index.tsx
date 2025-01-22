import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";
import { NuqsAdapter } from 'nuqs/adapters/react'
import { Toaster } from "./components/ui/toaster"

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <NuqsAdapter>
      <Toaster />
      <App />
    </NuqsAdapter>
    <Analytics />
  </React.StrictMode>
);
