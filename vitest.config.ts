import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.join(rootDir, "../zyfai-sdk");

function mergeIntegrationEnv(): Record<string, string> {
  const sdkEnv = loadEnv("test", sdkRoot, "");
  const localEnv = loadEnv("test", rootDir, "");
  return { ...sdkEnv, ...localEnv };
}

export default defineConfig({
  test: {
    env: mergeIntegrationEnv(),
    setupFiles: ["src/integration/setup.ts"],
    include: ["src/integration/**/*.integration.test.ts"],
    fileParallelism: false,
  },
});
