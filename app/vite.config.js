import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  // Keep Vite's generated dependency cache outside synced/restricted project
  // folders. On Windows an in-project cache could remain locked after deploys
  // and leave the local page indefinitely on its loading state.
  cacheDir: join(tmpdir(), "podujeva-climate-dashboard-vite"),
  plugins: [react()],
  server: { port: 5173, open: true },
});
