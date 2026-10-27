# Native Android Guide

Use the namespace com.karuhundeveloper.posoffline and register local Capacitor plugins in MainActivity. Keep Java comments English and user-visible errors Indonesian. Preserve explicit permission checks and lifecycle cleanup for camera, Bluetooth, USB and documents. Use Android's document picker and save flow; do not request broad storage access.

APK updates must validate the release URL, bounded HTTPS redirects, byte limit, SHA-256 checksum, package identity, increasing version and installed signer before opening the interactive system installer. Never bypass unknown-source permission or claim installation completed when the installer only opened. Signing keys and credentials stay outside Git and flow into Gradle through environment secrets.

After native changes run bun run cap:sync and Gradle assembleDebug. For release changes also build assembleRelease and bundleRelease with the persistent key and verify the APK signature. Generated assets, build directories and local SDK paths are ignored. Physical printing, file selection and update installation require device QA; successful compilation does not prove those flows.
