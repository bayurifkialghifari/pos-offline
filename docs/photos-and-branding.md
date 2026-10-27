# Local photos and branding

## Behavior

Local selected/captured media with media:// references. Photos and store logo travel as real bytes. Original SVG vectors generate density/adaptive/monochrome Android launcher icons and native splash.

## Implementation

[app/stores/media.ts](../app/stores/media.ts).

## Acceptance checks

Restore product photo/logo and restart. Regenerate icons with bun run icons.
