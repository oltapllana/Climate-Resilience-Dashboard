import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { makeT } from "./src/i18n.js";
import { documentMetadata } from "./src/lib/locale.js";

export default defineConfig({
  plugins: [react(), {
    name: "translated-default-metadata",
    transformIndexHtml: () => documentMetadata(makeT("en")).map(attrs => ({ tag: "meta", attrs, injectTo: "head" })),
  }],
  server: { port: 5173, open: true },
});
