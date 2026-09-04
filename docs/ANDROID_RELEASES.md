# Android Automated Releases & Builds

This document explains the automated release pipeline for Android `.aab` (Google Play Store) and `.apk` (local testing) artifacts.

---

## 🚀 Workflow Overview

Every merge to the `main` branch (after each Pull Request is merged) triggers the `.github/workflows/release-android.yml` workflow.

Additionally, builds can be triggered manually from the GitHub Actions web interface via `workflow_dispatch`.

### What the Workflow Does
1. **Pulls Full Git History (`fetch-depth: 0`)**: Accurately computes commit counts and git tags.
2. **Builds Web & Mobile Assets**: Executes `npm run build:css`, `npm run prepare:capacitor-web`, and `npx cap sync android`.
3. **Resolves Versioning**:
   - `versionName`: Synced with `package.json` (e.g. `1.1.0`).
   - `versionCode`: Dynamically calculated based on the total commit count on `main` (`git rev-list --count HEAD`), guaranteeing that every main merge has a strictly monotonically increasing integer required by Google Play Console.
4. **Decodes & Applies Release Keystore**: Decodes `ANDROID_KEYSTORE_BASE64` and signs release artifacts using production credentials stored in encrypted GitHub repository secrets.
5. **Compiles Artifacts via Gradle**:
   - `bundleRelease`: Produces signed `.aab` bundle for the Google Play Console.
   - `assembleDebug`: Produces debug `.apk` optimized for local phone testing without signature conflicts.
   - `assembleRelease`: Produces signed `.apk` matching release optimizations.
6. **Stages & Checksums**: Generates `SHA256SUMS.txt` for all release files.
7. **Uploads Workflow Artifacts**: Retained in GitHub Actions for 90 days.
8. **Publishes GitHub Release**: Creates a release tagged `v<versionName>-build.<versionCode>` with auto-generated release notes and attached downloads.

---

## 📦 Downloading & Using Release Artifacts

### 1. Google Play Console Deployment (.aab)
- **File**: `travel-planner-<version>-b<code>.aab` (or `app-release.aab`)
- **Usage**:
  1. Open [Google Play Console](https://play.google.com/console).
  2. Navigate to your app -> **Release** -> **Production** (or **Internal testing** / **Closed testing**).
  3. Click **Create new release** and upload the `.aab` file.
  4. Google Play verifies the signature and validates that `versionCode` is strictly greater than the previous release.

### 2. Local Device Testing (.apk)
- **File**: `travel-planner-<version>-b<code>-debug.apk` (or `app-debug.apk`)
- **Usage**:
  - **Direct Download**: Download the `.apk` directly to your phone from the GitHub Release page or Actions artifacts and tap to install (enable "Install unknown apps" if prompted).
  - **Via ADB (command line)**:
    ```bash
    adb install -r travel-planner-<version>-b<code>-debug.apk
    ```
  - **No Signature Conflicts**: The debug APK uses the standard Android debug certificate, allowing frictionless overwrite upgrades during development.

---

## 🔐 GitHub Secrets Configuration

The following repository secrets are configured under **Settings -> Secrets and variables -> Actions**:

| Secret Name | Description |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded `travelplanner-upload-key.keystore` file |
| `RELEASE_STORE_PASSWORD` | Keystore password (`travelplanner`) |
| `RELEASE_KEY_ALIAS` | Key alias (`travelplanner-upload-alias`) |
| `RELEASE_KEY_PASSWORD` | Key password (`travelplanner`) |

If secrets need to be updated:
```bash
# Update keystore secret via GitHub CLI
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes('android/app/travelplanner-upload-key.keystore')) | gh secret set ANDROID_KEYSTORE_BASE64
```

---

## 🛠 Local CLI Commands

| Command | Description |
|---|---|
| `npm run version:info` | Displays current `versionName`, calculated `versionCode`, git SHA, and target file names |
| `npm run build:all` | Compiles CSS, syncs Capacitor, and builds both `.aab` and `.apk` |
| `npm run build:aab` | Builds production `.aab` locally into `android/app/build/outputs/bundle/release/` |
| `npm run build:apk:debug` | Builds debug `.apk` locally into `android/app/build/outputs/apk/debug/` |
| `npm run android:run` | Builds debug APK, installs to attached phone/emulator via ADB, and launches the app |
