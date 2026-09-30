import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import { AppRoutes, routes } from "./router.js";
import { useAuthStore } from "./store/auth.store.js";
import "./styles.css";

const router = createBrowserRouter([
  {
    element: <AppRoutes />,
    children: routes,
  },
]);

// Restore session from stored token before first paint (guest vs logged-in state).
void useAuthStore.getState().restore();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
