import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "path"
import dotenv from "dotenv"

const workspaceRoot = path.resolve(__dirname, "../..")
dotenv.config({
  path: path.resolve(workspaceRoot, ".env"),
})

const serverPort = Number(process.env.PORT || "3000")

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "../server/public",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true
      }
    }
  }
})
