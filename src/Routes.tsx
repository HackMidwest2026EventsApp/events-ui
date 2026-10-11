import { createBrowserRouter } from "react-router";
import Events from "./pages/Events/Events";
import { Event } from "./pages/Event/Event";

export const router = createBrowserRouter(
  [
    {
      index: true,
      Component: Events,
    },
    {
      path: "/:eventId",
      Component: Event,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
