import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";

// Get git commit hash
const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch (_e) {
    return "unknown";
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode: _mode }) => ({
  define: {
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(getGitCommitHash()),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "@tanstack/react-query",
          ],
          ui: [
            "@radix-ui/react-slot",
            "lucide-react",
            "clsx",
            "tailwind-merge",
          ],
        },
      },
    },
  },
}));
