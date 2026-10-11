import { createBrowserRouter } from "react-router";
import Events from "./pages/Events/Events";
import { Event } from "./pages/Event/Event";
import Profile from "./pages/Profile/Profile";
import { Login, Register } from "./pages/Auth/AuthForm";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter(
  [
    {
      // Every page sits under the header, which is where the profile icon is.
      Component: Layout,
      children: [
        { index: true, Component: Events },
        { path: "login", Component: Login },
        { path: "register", Component: Register },
        { path: "profile", Component: Profile },
        // Last and dynamic: react-router ranks the static paths above it, and
        // a search id ("a5sj_qtrOnI-001") could not collide with them anyway.
        { path: ":eventId", Component: Event },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);
