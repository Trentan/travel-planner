---
name: cloud-sync-engine
description: Advanced quality, offline-first reconciliation, native Android GoogleAuth, background heartbeat sync, and Google Drive dedicated folder protocols for travel planner apps. Use when hardening cloud storage, building sync adapters, or auditing file persistence.
metadata:
  author: Antigravity Team
  version: 2.0.0
---

# Cloud Sync Engine & Storage Hardening Skill

This skill provides a systematic protocol for local-first storage, background cloud synchronization, native Android Capacitor GoogleAuth integration, dedicated Google Drive folder adapters (`TrenscendsTravelPlanner`), and visual file management.

---

## Core Storage Architecture & Guidelines

### 1. Dedicated Folder Isolation & Privacy Guard
- All cloud files MUST be stored inside a dedicated user folder named **`Google Drive / TrenscendsTravelPlanner`**.
- OAuth requests MUST enforce standard application MIME formats (`multipart/related; boundary="..."` for RFC 2046 compliance).
- Mock or synthetic tokens (e.g., `token_mock_...`, `mock_folder_123`) MUST be unconditionally purged on boot before making real Google Drive API requests.

### 2. Native Android GoogleAuth & OAuth Scopes
- Capacitor applications MUST utilize `@codetrix-studio/capacitor-google-auth` for native Google Account picker bottom sheets on Android devices.
- Android `AccountManager` MUST explicitly request the full Google Drive file scopes:
  `"oauth2:https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata profile email"`.
- Requests encountering `401 Unauthorized` must execute silent background token refresh (`ensureValidAccessToken()`) and retry once automatically.

### 3. Local-First Offline Resilience & Debounced Saves
- Local edits commit to **IndexedDB** synchronously to guarantee zero data loss.
- Cloud writes use a 5-second debounced queue (`autoSyncActiveTripToCloud`) to prevent unnecessary API overhead.
- A 60-second background heartbeat timer (`startBackgroundSyncLoop`) monitors remote `modifiedTime` timestamps when the app remains active.

### 4. Smart Conflict Resolution & Auto-Upload
- When Google Drive connects, all existing local trips automatically upload to the dedicated Drive folder (`uploadAllLocalTripsToDrive()`).
- If Google Drive reports a newer `modifiedTime` for a file than local IndexedDB, the engine automatically pulls and reconciles remote trip data.
- The UI MUST notify the user with a non-intrusive toast (`☁️ Synced "Europe 2026" from Google Drive`) without interrupting active editing state.

### 5. Interactive Visual Cloud File Explorer & 1-Tap Mobile Sync
- The unified Trips Hub (`#tripLibraryModal`) provides a visual file explorer listing all `.json` files in the cloud folder.
- File cards MUST display human-readable names, file size, last modified timestamp, country flags, and 1-tap action buttons:
  - `[ 📥 Load & Open ]`: Imports remote JSON into IndexedDB and sets active trip.
  - `[ ☁️ Sync ]`: Forces immediate bidirectional push/pull.
  - `[ ↗ Drive ]`: Direct link to view/download JSON on `drive.google.com`.
  - `[ 🗑️ Delete ]`: Deletes remote file with confirmation prompt.

---

## Execution Checklist

1. Verify native Android GoogleAuth token scopes and Gradle 9 / AGP 8 build hooks in `scripts/prepare-capacitor-web.js`.
2. Run automated integration test suite (`npm test`).
3. Verify `#headerCloudSyncStatusPill` and `#mobileCloudSyncStatusPill` across Desktop (`1440x900`) and Mobile (`390x844`) viewports.
4. Validate background heartbeat interval and debounced save queues.

