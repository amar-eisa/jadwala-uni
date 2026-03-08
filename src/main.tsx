import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

Sentry.init({
  dsn: "https://2d76af1e4069a8ccf1b7a9fe629f49f2@o4511010773008384.ingest.de.sentry.io/4511010793783376",
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.2,
});

createRoot(document.getElementById("root")!).render(<App />);
