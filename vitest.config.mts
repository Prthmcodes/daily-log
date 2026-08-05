import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    /**
     * Teach Vitest the same `@/...` shortcut that tsconfig.json gives the app,
     * so a file is imported the same way whether it is being built or tested.
     * Without this, any test importing a file that itself imports "@/lib/..."
     * fails to resolve.
     */
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // These tests are pure logic — no browser, no DOM, so plain Node is enough
    // and it starts far faster than a simulated browser would.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
