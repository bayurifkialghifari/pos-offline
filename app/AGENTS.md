# Application Guide

Follow the root agent guide. Nuxt route files in pages/ own route metadata and compose screens. Screens compose the Atomic Design components in components/; atoms must stay reusable and unaware of stores. Composables coordinate lifecycle and persistence. Keep domain calculations in lib/ and services/, SQL in repositories/, and native calls behind platform capabilities.

Use explicit typed imports and existing semantic Tailwind tokens. UI text is Indonesian; comments and documentation are English. Never load remote fonts or product images. Dialogs use BottomSheet and preserve focus trapping, Escape handling and accessible input names. Respect safe areas and reduced motion. Verify changed screens at phone and desktop widths in both themes.

Run bun run format before each commit, then bun run check for TypeScript or domain changes. Run the relevant browser scenario after changing checkout, navigation or backup UI. Production assets are generated into .output/public and must not be committed.
