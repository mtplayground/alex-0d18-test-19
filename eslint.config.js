const js = require("@eslint/js");
const prettier = require("eslint-config-prettier");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "node_modules/**",
      "package-lock.json",
      "apps/web/index.html",
      "eslint.config.js",
      "prettier.config.cjs",
      "apps/web/postcss.config.cjs"
    ]
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      globals: {
        module: "readonly",
        require: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
      }
    }
  }
);
