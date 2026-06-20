import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.js";
import path from "path";
import pkg from "./package.json";

// https://vite.dev/config/
export default defineConfig((mode) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];
  if (mode.mode === "extension") {
    plugins.push(crx({ manifest }));
  }

  return {
    plugins: plugins,
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_AUTHOR__: JSON.stringify(pkg.author),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // 拡張機能ビルドの場合は、base を空にして相対パスでリソースを参照する
    base: mode.mode === "extension" ? "" : "/mini-aquarium/",
  };
});
