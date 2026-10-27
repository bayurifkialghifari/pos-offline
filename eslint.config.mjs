import js from "@eslint/js"
import vue from "eslint-plugin-vue"
import ts from "typescript-eslint"
export default ts.config(
  {
    ignores: [
      ".nuxt/**",
      ".output/**",
      "node_modules/**",
      "android/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: ts.parser } },
  },
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Blob: "readonly",
        File: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        Uint8Array: "readonly",
        customElements: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        Image: "readonly",
        FileReader: "readonly",
        atob: "readonly",
        btoa: "readonly",
        crypto: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        alert: "readonly",
        confirm: "readonly",
        localStorage: "readonly",
        Event: "readonly",
        SVGSVGElement: "readonly",
        definePageMeta: "readonly",
        indexedDB: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "vue/multi-word-component-names": "off",
    },
  },
)
