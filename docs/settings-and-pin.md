# Settings and PIN

## Behavior

Store identity/logo, QRIS, light/dark/system appearance, optional salted local PIN and device prefix. PIN locks UI after restart, without database encryption. Business restore preserves target credentials and device settings.

Product units are accessed beside Products in Home's store-management shortcuts. Settings places its backup card and About button after the splash preferences. About opens a phone sheet or a centered desktop dialog without leaving Settings. The dialog shares version, changelog and manual updater content with the existing About route and restores keyboard focus when dismissed.

## Implementation

[app/screens/settings/SettingsPage.vue](../app/screens/settings/SettingsPage.vue).

## Acceptance checks

Enable PIN, restart, reject wrong PIN and unlock correctly. Restore business data while retaining target PIN and printer/device settings.

Open About from the bottom button, read the bundled changelog, check updates only on request, and dismiss with Escape or Close. Focus returns to the opener. Verify both themes and phone/desktop layouts.
