import React from "react";
import ReactDOM from "react-dom/client";
import "./index.scss";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { UserContextProvider } from "./contexts/UserContext";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <UserContextProvider>
      <BrowserRouter basename="/">
        <App />
      </BrowserRouter>
    </UserContextProvider>
  </React.StrictMode>,
);
