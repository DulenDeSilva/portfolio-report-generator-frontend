import type { Plugin } from "vite";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = "http://127.0.0.1:4000";

function apiProxyHintPlugin(): Plugin {
  return {
    name: "api-proxy-hint",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        fetch(`${API_TARGET}/api/health`)
          .then((res) => {
            if (!res.ok) throw new Error(String(res.status));
          })
          .catch(() => {
            server.config.logger.warn(
              "\n  API not reachable at http://127.0.0.1:4000 — uploads will fail.\n" +
                "  Start the backend repo first: npm run dev\n",
            );
          });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiProxyHintPlugin()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (_err, _req, res) => {
            if (res && "writeHead" in res && !res.headersSent) {
              res.writeHead(503, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error:
                    "API server is not running on port 4000. Start the backend repo with npm run dev.",
                }),
              );
            }
          });
        },
      },
    },
  },
});
