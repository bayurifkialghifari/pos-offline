# POS Offline Design System

## Reference and intent

The Point of sale app reference by Dipa Inhouse (Dribbble shot 26555653) supplies rounded card rhythm, charcoal controls, pale surfaces and lime highlights. The user requested a mix with POS Kacaw, rather than a pixel clone. Preserve the cashier flow, navigation and dynamic QRIS; redesign dashboard, transactions, reports and cashflow. No third-party brand artwork is copied.

The current Home and Settings revision follows the local Laundry Stitch theme and the three supplied phone screenshots. Use charcoal heroes, mint actions, a blue sales tile, white rounded cards and quiet gray surfaces. The earlier Pinterest bento reference remains a composition cue. Preserve tablet navigation, card grids and content width; change the phone composition explicitly at the 768 px breakpoint.

## Personas and constraints

Owners review sales and cash movement. Cashiers scan, weigh and accept exact requested amounts. A cashier with one free hand needs large targets and clear totals. All daily workflows run without internet. A system font avoids external requests.

## Tokens

Light: canvas #f8f9fb, card #ffffff, ink/primary/hero #161c28, secondary ink #414b5c, muted ink #626d7b, muted surface #edf5fa, hairline #e2e7ed. Primary controls use white text. Mint #00e29d with charcoal ink highlights the phone transaction action. Featured sales uses sky #a1e0fd with charcoal ink. Monetary blue #1e667f; incoming green #007d58; outgoing red #be4141; amber #a65b08. Dark: canvas #10151e, card #1a2230, ink #edf2f8, muted ink #aab5c5, muted surface #253142, hairline #364458; primary #edf2f8 with charcoal ink; featured #244758 with light ink. Hero remains charcoal with light text. Semantic inks use lighter variants in dark mode. No colored card edge stripes.

System sans: body 14–16 px, metadata 12 px, screen heading 22–28 px, metrics 26–36 px. Use tabular numerals for amounts. Spacing: 4, 8, 12, 16, 20, 24, 32, 48 px. Card radius 24 px, pill buttons, input radius 14 px, sheets 24 px. Low shadow: 0 2px 4px rgb(22 28 40 / 3%); raised shadow: 0 16px 48px rgb(22 28 40 / 12%). Neutral hairlines define layers.

## Primitives and atomic design

Atoms: buttons, inputs, badges, labels and toggles. Molecules: money inputs, date filters, metric cards and empty states. Organisms: cart, payment, scanner, navigation, trend chart and activity rows. Templates: responsive app shell and screen layouts. Nuxt pages compose templates/screens and contain no SQL or native calls.

## Layout and scrolling

At 768 px and above preserve the fixed 256 px sidebar and one scrolling main surface. Below 768 px use the existing five-route bottom navigation with a dark filled active item and a single scrolling main. The shell is bounded by 100dvh. Cashier uses a product grid and cart sheet. Main content uses min-width:0 and min-height:0. Safe areas apply to headers, bottom navigation and sheets. Charts provide textual totals and dates.

Phone Home order: charcoal store hero with mint transaction action, daily bento, trend/cashier/activity analytics, store management, then backup. The sky sales tile spans two rows beside transaction count and average; incoming/outgoing cash follow and net cash spans the full width. Below 360 px stack summary tiles for amount readability. At 768 px and above retain the existing header, management-first order, sales/count/average tile, cash columns and twelve-column analytics grid. Render content once in DOM/tab order at each breakpoint, without dense packing or CSS order changes. Products and Product units remain adjacent. The final section is a backup card with a heading, icon, title, description and button below.

Dashboard cards use 24 px radii, 12–24 px gaps/padding, 40–48 px icon wells and 26–36 px tabular amounts. Icon wells use semantic inks at low opacity. Zero-data screens show actual zero totals and useful links, never fictional growth. Phone Settings adds a charcoal store identity hero and Laundry-style icon section headings; preserve all profile, logo, QRIS, PIN, light/dark and splash controls. Settings ends with backup followed by an inline version/update card and device prefix. The card shows installed version, a changelog button, explicit unchecked/checking/current/available/error states and a manual update action. Opening either Settings or About never checks GitHub. Changelog opens in a focus-trapped sheet on phones and centered dialog on desktop; render bundled English headings and lists safely as text. The standalone About route uses the same version card. Escape, Close and Android Back dismiss the active dialog before route navigation.

Phone store shortcuts use compact horizontal cards with 36 px icon wells. Native scrollbars and controls follow the selected light/dark color scheme.

## Interaction and states

Controls show hover, pressed, focus and disabled states. Loading, empty, validation error and populated states use real data. Transitions use opacity and transform, at most 200 ms. Honor prefers-reduced-motion. Restore and void actions require explicit confirmation. Dynamic QRIS never claims that payment has been verified.

## Accessibility

Touch controls target 44 px. Inputs have labels and icon controls have accessible names. Keyboard focus is visible. Dialogs trap focus and support Escape. Semantic colors include text labels. Data remains readable on narrow phones and with large text.

## Branding

Editable cashier/receipt SVG artwork, charcoal/lime adaptive launcher layers, monochrome icon, favicon and splash. Store logos are user media and remain separate from application identity.

## Verification and debt

Validate every route at phone and desktop widths in light/dark. Check overflow, checkout, portable restore and offline restart. Physical printer, camera and APK installation are recorded separately from browser checks. No mock sales appear in a new production database. Demo fixtures are test-only.
