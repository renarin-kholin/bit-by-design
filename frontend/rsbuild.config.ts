import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";
import { pluginCssMinimizer } from "@rsbuild/plugin-css-minimizer";

// https://rsbuild.dev/guide/basic/configure-rsbuild
{
  /* <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="shortcut icon" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" /> */
}
export default defineConfig({
  plugins: [pluginReact(), pluginCssMinimizer()],
  html: {
    favicon: "public/favicon.svg",
    title: "Bit By Design",
    meta: {
      description:
        "Online design competition by IOIT ACM Student Chapter at AISSMS IOIT.",
    },
    appIcon: {
      name: "Bit By Design",
      filename: "public/site.webmanifest",
      icons: [
        {
          src: "public/favicon-96x96.png",
          size: 96,
        },
        {
          src: "public/apple-touch-icon.png",
          target: "apple-touch-icon",
          size: 180,
        },
      ],
    },
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
