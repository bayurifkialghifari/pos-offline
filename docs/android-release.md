# Android CI and releases

## Behavior

Main/PR quality/static/browser checks and Android debug APK. Stable tags validate package/changelog, sign APK/AAB with persistent protected environment secrets and publish SHA256SUMS.txt. VersionCode = major*1000000+minor*1000+patch. No tag is created automatically.

## Implementation

[.github/workflows/android-release.yml](../.github/workflows/android-release.yml).

## Acceptance checks

Validate node scripts/release-metadata.mjs v0.1.0 /tmp/pos-offline-notes.md. Push a requested stable tag and inspect APK/AAB/checksum assets.

Checksum entries use bare asset filenames, without a ./ prefix. The owning release test executes the workflow's checksum command on temporary APK/AAB fixtures and checks that the updater accepts its output.

## Signing setup

The android-release environment requires ANDROID_KEYSTORE_BASE64, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS and ANDROID_KEY_PASSWORD. Upload secrets with gh secret set --repo bayurifkialghifari/pos-offline --env android-release. Privately back up the persistent JKS/passwords outside Git. Debug installs have a different signer and cannot upgrade to a production-key APK directly.

## Release steps

Update package.json, default Android version and dated CHANGELOG.md section. Run Prettier/checks, commit atomically and create/push the stable tag when a release is intended. CI validates metadata and passes explicit version properties to Gradle. Assets are pos-offline-vMAJOR.MINOR.PATCH.apk, .aab and SHA256SUMS.txt. The in-app updater uses the signed APK; AAB is for store distribution. Store re-signing requires matching the installed signing identity for direct APK updates. Never casually rotate the production key.
