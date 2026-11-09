import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command }) => ({
  plugins: [
    tanstackStart({
      server: { entry: "src/server.ts" },
      client: { entry: "src/client.tsx" },
    }),
    viteReact(),
    tailwindcss(),
    tsConfigPaths(),
    ...(command === "build"
      ? [
          nitro({
            preset: "vercel",
            inlineDynamicImports: true,
          }),
        ]
      : []),
  ],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
}));

