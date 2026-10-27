# POS Offline Design System

## Reference and intent

The Point of sale app reference by Dipa Inhouse (Dribbble shot 26555653) supplies rounded card rhythm, charcoal controls, pale surfaces and lime highlights. The user requested a mix with POS Kacaw, rather than a pixel clone. Preserve the cashier flow, navigation and dynamic QRIS; redesign dashboard, transactions, reports and cashflow. No third-party brand artwork is copied.

## Personas and constraints

Owners review sales and cash movement. Cashiers scan, weigh and accept exact requested amounts. A cashier with one free hand needs large targets and clear totals. All daily workflows run without internet. A system font avoids external requests.

## Tokens

Light: canvas #f4f5f0, card #ffffff, ink #20251f, muted ink #62685f, muted surface #edf0e8, hairline #dce0d6. Dark: canvas #151a16, card #202721, ink #f3f5ee, muted ink #aab2a5, muted surface #2c352d, hairline #3b453b. Primary lime #d4ed72 with charcoal ink; monetary blue #2863bc; incoming green #25704b; outgoing red #be4141. Dark semantic inks use lighter variants. No colored card edge stripes.

System sans: body 14–16 px, metadata 12 px, screen heading 22–28 px, metrics 26–36 px. Use tabular numerals for amounts. Spacing: 4, 8, 12, 16, 20, 24, 32, 48 px. Card radius 20 px, controls 12 px, sheets 24 px. Neutral hairlines and soft shadows define layers.

## Primitives and atomic design

Atoms: buttons, inputs, badges, labels and toggles. Molecules: money inputs, date filters, metric cards and empty states. Organisms: cart, payment, scanner, navigation, trend chart and activity rows. Templates: responsive app shell and screen layouts. Nuxt pages compose templates/screens and contain no SQL or native calls.

## Layout and scrolling

At 768 px and above use a fixed 224 px sidebar and one scrolling main surface. Below 768 px use bottom navigation and a single scrolling main. Cashier uses a product grid and cart sheet. Main content uses min-width:0. Safe areas apply to headers, bottom navigation and sheets. Charts provide textual totals and dates. Existing POS Kacaw is the concrete structural source; the Dribbble reference supplies surface treatment.

## Interaction and states

Controls show hover, pressed, focus and disabled states. Loading, empty, validation error and populated states use real data. Transitions use opacity and transform, at most 200 ms. Honor prefers-reduced-motion. Restore and void actions require explicit confirmation. Dynamic QRIS never claims that payment has been verified.

## Accessibility

Touch controls target 44 px. Inputs have labels and icon controls have accessible names. Keyboard focus is visible. Dialogs trap focus and support Escape. Semantic colors include text labels. Data remains readable on narrow phones and with large text.

## Branding

Editable cashier/receipt SVG artwork, charcoal/lime adaptive launcher layers, monochrome icon, favicon and splash. Store logos are user media and remain separate from application identity.

## Verification and debt

Validate every route at phone and desktop widths in light/dark. Check overflow, checkout, portable restore and offline restart. Physical printer, camera and APK installation are recorded separately from browser checks. No mock sales appear in a new production database. Demo fixtures are test-only.
