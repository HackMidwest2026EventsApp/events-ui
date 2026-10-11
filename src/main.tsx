import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@mantine/core/styles.css";

import { RouterProvider } from "react-router";
import { router } from "./Routes";
import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./components/AuthProvider";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* Inside the query client: the session is a /auth/me query. */}
      <AuthProvider>
        <MantineProvider>
          <RouterProvider router={router} />
        </MantineProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
