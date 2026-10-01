import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * Vercel serves this app at the domain root.
 * Nitro's `vercel` preset writes the Build Output API to `.vercel/output`.
 */
export default defineConfig({
  nitro: {
    preset: "vercel",
  },
  vite: {
    server: {
      allowedHosts: ["localhost", "127.0.0.1"],
    },
  },
});
