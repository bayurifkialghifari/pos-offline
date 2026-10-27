import tailwindcss from "@tailwindcss/vite"

export default defineNuxtConfig({
  compatibilityDate: "2026-10-27",
  ssr: false,
  srcDir: "app/",
  devtools: { enabled: false },
  modules: ["@pinia/nuxt"],
  css: ["~/assets/index.css"],
  components: false,
  imports: { dirs: [] },
  vite: { plugins: [tailwindcss()] },
  typescript: {
    strict: true,
    tsConfig: { compilerOptions: { noFallthroughCasesInSwitch: true } },
  },
  app: {
    head: {
      title: "POS Offline",
      htmlAttrs: { lang: "id" },
      meta: [
        {
          name: "description",
          content:
            "Kasir offline untuk usaha Anda. Produk, stok, QRIS, dan laporan dalam satu aplikasi.",
        },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },
  nitro: { prerender: { routes: ["/"] } },
})
