import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    sentryVitePlugin({
      org: "oswaldinho",
      project: "weedhub",
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
});
