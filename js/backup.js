// Enhanced travel-planner.js
// Backup reminder system for browser-based file management

// Backup tracking variables
let editCountSinceExport = 0;
let lastExportTimestamp = null;
const BACKUP_REMINDER_DAYS = 3;
const BACKUP_REMINDER_EDITS = 20;

function hasConnectedFileHandle() {
  return typeof window.hasActiveFileHandle === 'function' && window.hasActiveFileHandle();
}

// Initialize tracking on app load
window.addEventListener('DOMContentLoaded', function() {
  loadBackupTracking();
  updateExportIndicator();
  setTimeout(checkBackupReminder, 2000);
});

// Load tracking state from localStorage
function loadBackupTracking() {
  editCountSinceExport = parseInt(localStorage.getItem('travelApp_editCount') || '0');
  lastExportTimestamp = localStorage.getItem('travelApp_lastExport');
}

// Track when user makes edits
function trackUserEdit() {
  editCountSinceExport++;
  localStorage.setItem('travelApp_editCount', editCountSinceExport);

  // Show reminder every 20 edits
  if (editCountSinceExport % 20 === 0) {
    setTimeout(checkBackupReminder, 1000);
  }
}

// Reset counter after successful export
function resetEditTracking() {
  editCountSinceExport = 0;
  localStorage.setItem('travelApp_editCount', '0');
}

// Check if we should show a backup reminder
function checkBackupReminder() {
  if (hasConnectedFileHandle()) {
    hideBackupReminder();
    return;
  }

  const lastExport = localStorage.getItem('travelApp_last_export_v2026');
  const lastFileName = localStorage.getItem('travelApp_last_export_filename') || 'your trip file';
  const fsSupported = typeof window.isFSASupported === 'function' && window.isFSASupported();
  const firstTimeMessage = fsSupported
    ? 'You have not connected a file yet. Tap Save As to create the JSON file you want the app to keep updating.'
    : 'You have not connected a file yet. Tap Export Backup to download your first JSON file.';
  const refreshMessage = fsSupported
    ? 'Tap Save As to create a file, or Open File later if you want to switch to a different JSON file.'
    : 'Tap Export Backup whenever you want a fresh copy.';

  if (!lastExport) {
    showBackupReminder(`Welcome! This app saves to your browser. ${firstTimeMessage} 💡 Tip: Use one filename for the master copy and keep using it for autosave.`);
    return;
  }

  const daysSince = (Date.now() - new Date(lastExport).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince >= BACKUP_REMINDER_DAYS) {
    showBackupReminder(`It's been ${Math.floor(daysSince)} days since your last backup (${lastFileName}). ${refreshMessage} 💡 Tip: Use the same filename each time to keep one master backup file.`);
    return;
  }

  if (editCountSinceExport >= BACKUP_REMINDER_EDITS) {
    showBackupReminder(`You've made ${editCountSinceExport} changes since your last backup (${lastFileName}). ${refreshMessage} 💡 Tip: Use the same filename each time to keep one master backup file.`);
  }
}

// Show friendly reminder popup
function showBackupReminder(message) {
  const existing = document.getElementById('backup-reminder');
  if (existing) return;

  const reminder = document.createElement('div');
  reminder.id = 'backup-reminder';
  reminder.innerHTML = `
    <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
      <div style="background: #FFF3CD; border: 1px solid #FFE69C; border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); max-width: 380px;">
        <div style="font-weight: 500; color: #856404; margin-bottom: 8px;">💾 Backup Reminder</div>
        <div class="reminder-text" style="font-size: 14px; color: #856404; margin-bottom: 8px;">${message}</div>
        <div style="font-size: 12px; color: #6C757D; margin-bottom: 12px; font-style: italic;">💡 Tip: After exporting, find the downloaded file and copy it to overwrite your previous backup.</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="${typeof window.isFSASupported === 'function' && window.isFSASupported() ? 'hideBackupReminder(); openTripFile();' : 'exportJSON(); checkBackupReminder(); hideBackupReminder();'}"
                  style="padding: 6px 12px; background: #27AE60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">${typeof window.isFSASupported === 'function' && window.isFSASupported() ? 'Open File' : 'Export Now'}</button>
          <button onclick="hideBackupReminder();"
                  style="padding: 6px 12px; background: #6C757D; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Later</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(reminder);
}

// Hide reminder popup
function hideBackupReminder() {
  const reminder = document.getElementById('backup-reminder');
  if (reminder) reminder.remove();
}

// Update export indicator showing last export
function updateExportIndicator() {
  const lastExport = localStorage.getItem('travelApp_last_export_v2026');
  const lastFile = localStorage.getItem('travelApp_last_export_filename');
  const indicator = document.getElementById('exportIndicator') || document.getElementById('timestampStatus');

  if (!indicator) return;

  if (hasConnectedFileHandle()) {
    const connectedName = typeof window.getActiveFileHandleName === 'function'
      ? window.getActiveFileHandleName()
      : lastFile;
    indicator.innerHTML = `📁 Connected file: ${connectedName || 'selected file'}`;
    indicator.style.opacity = '0.8';
    indicator.style.fontSize = '0.8rem';
    return;
  }

  if (lastExport && lastFile) {
    const date = new Date(lastExport);
    const formatted = date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
    indicator.innerHTML = `📤 Last exported: ${lastFile} on ${formatted} at ${time}`;
    indicator.style.opacity = '0.8';
    indicator.style.fontSize = '0.8rem';
  } else {
    indicator.innerHTML = '⚠️ Not yet saved to file';
    indicator.style.opacity = '0.8';
    checkBackupReminder();
  }
}

// Wrapper functions for edit tracking
const originalSaveData = window.saveData;
window.saveData = function(showTick = true) {
  originalSaveData(showTick);
  if (showTick) trackUserEdit();
};

const originalExportJSON = window.exportJSON;
window.exportJSON = function() {
  originalExportJSON();
  hideBackupReminder();
  updateExportIndicator();
  resetEditTracking();
};

// Export reminder functions to global scope
window.loadBackupTracking = loadBackupTracking;
window.trackUserEdit = trackUserEdit;
window.resetEditTracking = resetEditTracking;
window.checkBackupReminder = checkBackupReminder;
window.showBackupReminder = showBackupReminder;
window.hideBackupReminder = hideBackupReminder;
window.updateExportIndicator = updateExportIndicator;

