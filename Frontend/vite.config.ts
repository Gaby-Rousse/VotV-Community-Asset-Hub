import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ],
  server: {
    proxy: {
      '/api': 'http://10.0.0.131:5130',
      '/uploads': 'http://10.0.0.131:5130'
    }
  }
}));