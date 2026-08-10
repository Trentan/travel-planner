---
name: cloud-sync-engine
description: Advanced quality, offline-first reconciliation, background heartbeat sync, and Google Drive dedicated folder protocols for travel planner apps. Use when hardening cloud storage, building sync adapters, or auditing file persistence.
metadata:
  author: Antigravity Team
  version: 1.0.0
---

# Cloud Sync Engine & Storage Hardening Skill

This skill provides a systematic protocol for local-first storage, background cloud synchronization, dedicated Google Drive folder adapters (`TrenscendsTravelPlanner`), and visual file management.

## Core Storage Architecture & Guidelines

### 1. Dedicated Folder Isolation & Privacy Guard
- All cloud files MUST be stored inside a dedicated user folder named **`Google Drive / TrenscendsTravelPlanner`**.
- OAuth requests MUST enforce standard application MIME formats (`multipart/related; boundary="..."` for RFC 2046 compliance).
- Mock or synthetic folder IDs (e.g., `mock_folder_123`) MUST be purged prior to executing real Google Drive API network requests.

### 2. Local-First Offline Resilience
- Local edits commit to **IndexedDB** synchronously to guarantee zero data loss.
- Cloud writes use a 5-second debounced queue (`autoSyncActiveTripToCloud`) to prevent unnecessary API overhead.
- A 60-second background heartbeat timer (`startBackgroundSyncLoop`) monitors remote `modifiedTime` timestamps when the app tab remains open.

### 3. Smart Conflict Resolution & Pull Engine
- If Google Drive reports a newer `modifiedTime` for a file than local IndexedDB, the engine automatically pulls and reconciles remote trip data.
- The UI MUST notify the user with a non-intrusive toast (`☁️ Synced "Europe 2026" from Google Drive`) without interrupting active editing state.

### 4. Interactive Visual Cloud File Explorer
- Modals (`#cloudSyncModal` and `#tripLibraryModal`) MUST provide a visual file explorer listing all `.json` files in the cloud folder.
- File cards MUST display human-readable names, file size, last modified timestamp, country flags, and 1-click action buttons:
  - `[ 📥 Load Trip ]`: Imports remote JSON into IndexedDB and sets active trip.
  - `[ 🔄 Sync Now ]`: Forces immediate bidirectional push/pull.
  - `[ ↗ Open in Drive ]`: Direct link to view/download JSON on `drive.google.com`.
  - `[ 🗑️ Delete from Cloud ]`: Deletes remote file with confirmation prompt.

## Execution Checklist

1. Run automated integration test suite (`npm run test:live -- --local`).
2. Verify top app bar `#headerCloudSyncStatusPill` across Desktop (`1440x900`) and Mobile (`390x844`) viewports.
3. Validate background heartbeat interval and debounced save queues.
4. Execute `npm test` to ensure 100% core regression pass rate.
