# Settings and PIN

## Behavior

Store identity/logo, QRIS, light/dark appearance, optional salted local PIN and device prefix. PIN locks UI after restart, without database encryption. Business restore preserves target credentials and device settings.

Product units are accessed beside Products in Home's store-management shortcuts. Phone Settings uses a charcoal store identity hero and icon section headings. All existing profile, logo, QRIS, PIN, theme and splash handlers remain available. Settings places backup after splash preferences, then an inline version/update card and the device prefix. Changelog opens a phone sheet or centered desktop dialog without leaving Settings and restores keyboard focus when dismissed. The About route uses the same version card.

## Implementation

[app/screens/settings/SettingsPage.vue](../app/screens/settings/SettingsPage.vue).

## Acceptance checks

Enable PIN, restart, reject wrong PIN and unlock correctly. Restore business data while retaining target PIN and printer/device settings.

Read the inline version and unchecked or fresh cached update status, open the bundled changelog, and check updates only on request. A completed GitHub response disables further checks for one hour and displays the next check time; fresh cached feedback survives reopening Settings/About and the app. Expiry never checks automatically. Dismiss the dialog with Escape, Close or Android Back; focus returns to the opener. Verify both themes and phone/tablet layouts, saved profile data and long store names at 320 pixels.
