import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Load responsive overrides only on real mobile devices. This keeps desktop
// Edge/Chrome (including touchscreen Windows laptops) on the original layout.
const uaMobile = navigator.userAgentData?.mobile;
const mobileFallback =
  /Android|iPhone|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
  (/Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (uaMobile === true || (uaMobile == null && mobileFallback)) {
  import("./mobile.css").then(renderApp, renderApp);
} else {
  renderApp();
}
