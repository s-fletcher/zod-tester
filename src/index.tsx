import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { Analytics } from "@vercel/analytics/react";
import { NuqsAdapter } from "nuqs/adapters/react";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ZodVersionProvider } from "./contexts/ZodVersionContext";

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ZodVersionProvider>
          <Toaster />
          <App />
        </ZodVersionProvider>
      </NuqsAdapter>
    </QueryClientProvider>
    <Analytics />
  </React.StrictMode>
);
