import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "."),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    proxy: process.env.NODE_ENV === "development" ? {
      "/api": process.env.VITE_API_URL || "http://localhost:3000", // forward API requests
    } : {},
    host: '0.0.0.0',
    port: 5173,
  },
});
