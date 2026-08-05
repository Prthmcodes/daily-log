import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // These tests are pure logic — no browser, no DOM, so plain Node is enough
    // and it starts far faster than a simulated browser would.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
