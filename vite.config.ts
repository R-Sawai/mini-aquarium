import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.config.js";

// https://vite.dev/config/
export default defineConfig((mode) => {
  const plugins: PluginOption[] = [react(), tailwindcss()];
  if (mode.mode === "extension") {
    plugins.push(crx({ manifest }));
  }

  return {
    plugins: plugins,
    // 拡張機能ビルドの場合は、base を空にして相対パスでリソースを参照する
    base: mode.mode === "extension" ? "" : "/mini-aquarium/",
  };
});
