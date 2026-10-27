# Settings and PIN

## Behavior

Store identity/logo, QRIS, light/dark/system appearance, optional salted local PIN and device prefix. PIN locks UI after restart, without database encryption. Business restore preserves target credentials and device settings.

## Implementation

[app/screens/settings/SettingsPage.vue](../app/screens/settings/SettingsPage.vue).

## Acceptance checks

Enable PIN, restart, reject wrong PIN and unlock correctly. Restore business data while retaining target PIN and printer/device settings.
