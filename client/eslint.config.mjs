import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The browser SMTP-failure test runs a second `next dev` instance with
    // its own build output (see NEXT_DIST_DIR in playwright.config.ts) so
    // it doesn't race the primary instance's .next directory.
    ".next-*/**",
  ]),
]);

export default eslintConfig;
