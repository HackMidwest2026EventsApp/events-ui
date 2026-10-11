import { createBrowserRouter } from "react-router";
import Events from "./pages/Events/Events";
import { Event } from "./pages/Event/Event";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: Events,
    },
    {
      path: ":eventId",
      Component: Event,
    },
  ],
  { basename: import.meta.env.VITE_BASE_URL },
);
