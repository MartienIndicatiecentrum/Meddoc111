import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "*.config.js", "*.config.ts", "build", "venv"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // TypeScript rules - less strict for development
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // General code quality rules - less strict
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "no-debugger": "warn",
      "no-alert": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
      "no-unused-expressions": "warn",
      "no-duplicate-imports": "warn",
      "no-unreachable": "warn",
      "no-constant-condition": "warn",

      // Best practices - less strict
      "eqeqeq": ["warn", "always"],
      "curly": ["warn", "all"],
      "no-eval": "warn",
      "no-implied-eval": "warn",
      "no-new-func": "warn",
      "no-script-url": "warn",

      // Code style - less strict
      "indent": ["warn", 2],
      "quotes": ["warn", "single", { avoidEscape: true }],
      "semi": ["warn", "always"],
      "comma-dangle": ["warn", "always-multiline"],
      "object-curly-spacing": ["warn", "always"],
      "array-bracket-spacing": ["warn", "never"],
      "comma-spacing": ["warn", { before: false, after: true }],
      "key-spacing": ["warn", { beforeColon: false, afterColon: true }],
      "keyword-spacing": ["warn", { before: true, after: true }],
      "space-before-blocks": "warn",
      "space-before-function-paren": ["warn", {
        anonymous: "always",
        named: "never",
        asyncArrow: "always"
      }],
      "space-in-parens": ["warn", "never"],
      "space-infix-ops": "warn",
      "space-unary-ops": ["warn", { words: true, nonwords: false }],
      "spaced-comment": ["warn", "always"],

      // Import rules
      // Import rules are handled by TypeScript ESLint
    },
  },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
      }],
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "no-debugger": "warn",
      "no-alert": "warn",
      "no-var": "warn",
      "prefer-const": "warn",
    },
  }
);
