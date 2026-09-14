import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cpSync, mkdirSync } from "node:fs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "original-game-assets",
      closeBundle() {
        mkdirSync("dist", { recursive: true });
        for (const path of [
          "Interior Asset",
          "Portrait_Generator",
          "Modern_UI_Style_1.png",
        ])
          cpSync(path, "dist/" + path, { recursive: true });
      },
    },
  ],
});
