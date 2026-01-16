import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";
import { pluginCssMinimizer } from "@rsbuild/plugin-css-minimizer";

// https://rsbuild.dev/guide/basic/configure-rsbuild
export default defineConfig({
  plugins: [pluginReact(), pluginCssMinimizer()],
  html: {
    favicon: "src/assets/favicon.ico",
    title: "Loco SaaS Starter",
  },
  source: {
    entry: {
      index: "./src/main.tsx",
    },
  },
  tools: {
    lightningcssLoader: false,
    rspack: {
      experiments: {
        css: true,
      },
      plugins: [
        tanstackRouter({
          target: "react",
          autoCodeSplitting: true,
        }),
      ],
    },
    postcss: {
      postcssOptions: {
        plugins: ["@tailwindcss/postcss"],
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5150",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
