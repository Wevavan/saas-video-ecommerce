import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@/components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@/lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "@/hooks": fileURLToPath(new URL("./src/hooks", import.meta.url)),
      "@/utils": fileURLToPath(new URL("./src/utils", import.meta.url)),
      "@/types": fileURLToPath(new URL("./src/types", import.meta.url)),
      "@/styles": fileURLToPath(new URL("./src/styles", import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
})