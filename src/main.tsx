
import React from "react";
import ReactDOM from "react-dom/client";
import { IamProvider } from "@hanzo/iam/react";
import App from "./App";
import "./styles/index.css";

const iamConfig = {
  serverUrl: import.meta.env.VITE_HANZO_IAM_URL || "https://iam.hanzo.ai",
  clientId: import.meta.env.VITE_HANZO_IAM_APP || "hanzo-app",
  organization: import.meta.env.VITE_HANZO_IAM_ORG || "hanzo",
  redirectUri:
    (typeof window !== "undefined" ? window.location.origin : "https://hanzo.app") +
    "/auth/callback",
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IamProvider config={iamConfig}>
      <App />
    </IamProvider>
  </React.StrictMode>
);
