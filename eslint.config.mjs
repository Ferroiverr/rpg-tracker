import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const requireNextConfig = createRequire(require.resolve("eslint-config-next/package.json"));
const tsParser = requireNextConfig("@typescript-eslint/parser");
const nextPlugin = require("@next/eslint-plugin-next");

// Совместимый с пакетами в исходном архиве минимальный ESLint.
// Строгую проверку TypeScript отдельно выполняет `npx tsc --noEmit`.
export default [
  { ignores: ["node_modules/**", ".next/**", "next-env.d.ts", "out/**", "build/**"] },
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "@next/next": nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules },
  },
];
